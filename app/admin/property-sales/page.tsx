'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, MapPin, DollarSign, CheckCircle, XCircle, Eye, Star, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

interface PropertySale {
  id: string;
  title: string;
  property_type: string;
  price: number;
  status: string;
  is_featured: boolean;
  views_count: number;
  images: string[];
  address: string;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  cities?: {
    name: string;
  };
}

interface Inquiry {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  status: string;
  created_at: string;
  property_sales?: {
    title: string;
    price: number;
  };
}

export default function PropertySalesPage() {
  const [properties, setProperties] = useState<PropertySale[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [propertiesResult, inquiriesResult] = await Promise.all([
      supabase
        .from('property_sales')
        .select(`
          *,
          profiles:host_id(full_name, email),
          cities(name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('sales_inquiries')
        .select(`
          *,
          property_sales(title, price)
        `)
        .order('created_at', { ascending: false })
    ]);

    if (propertiesResult.data) setProperties(propertiesResult.data);
    if (inquiriesResult.data) setInquiries(inquiriesResult.data);
    setLoading(false);
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    const { error } = await supabase
      .from('property_sales')
      .update({ status })
      .eq('id', propertyId);

    if (error) {
      toast.error('Failed to update property status');
    } else {
      toast.success(`Property ${status}`);
      fetchData();
    }
  };

  const toggleFeatured = async (propertyId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('property_sales')
      .update({ is_featured: !currentStatus })
      .eq('id', propertyId);

    if (error) {
      toast.error('Failed to update featured status');
    } else {
      toast.success(`Property ${!currentStatus ? 'featured' : 'unfeatured'}`);
      fetchData();
    }
  };

  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    const { error } = await supabase
      .from('sales_inquiries')
      .update({ status })
      .eq('id', inquiryId);

    if (error) {
      toast.error('Failed to update inquiry status');
    } else {
      toast.success('Inquiry status updated');
      fetchData();
    }
  };

  const filteredProperties = properties.filter(p =>
    statusFilter === 'all' || p.status === statusFilter
  );

  const filteredInquiries = inquiries.filter(i =>
    inquiryStatusFilter === 'all' || i.status === inquiryStatusFilter
  );

  const stats = {
    totalProperties: properties.length,
    pending: properties.filter(p => p.status === 'pending').length,
    approved: properties.filter(p => p.status === 'approved').length,
    sold: properties.filter(p => p.status === 'sold').length,
    totalInquiries: inquiries.length,
    newInquiries: inquiries.filter(i => i.status === 'new').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Property Sales Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage properties for sale and buyer inquiries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Properties</p>
              <p className="text-2xl font-bold text-brand-navy">{stats.totalProperties}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sold</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Inquiries</p>
              <p className="text-2xl font-bold text-brand-navy">{stats.totalInquiries}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">New Inquiries</p>
              <p className="text-2xl font-bold text-orange-600">{stats.newInquiries}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList>
            <TabsTrigger value="properties">Properties for Sale</TabsTrigger>
            <TabsTrigger value="inquiries">Buyer Inquiries</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Properties</CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProperties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <img
                            src={property.images?.[0] || 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'}
                            alt={property.title}
                            className="w-full lg:w-32 h-32 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-brand-navy">{property.title}</h4>
                              {property.is_featured && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                              <div>
                                <p className="text-muted-foreground">Price</p>
                                <p className="font-bold text-brand-green">${property.price?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{property.property_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Location</p>
                                <p className="font-medium">{property.cities?.name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Beds/Baths</p>
                                <p className="font-medium">{property.bedrooms}/{property.bathrooms}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={
                                property.status === 'approved' ? 'bg-green-100 text-green-800' :
                                property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {property.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                <Eye className="h-3 w-3 inline mr-1" />
                                {property.views_count} views
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            {property.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-brand-green hover:bg-brand-green/90"
                                  onClick={() => updatePropertyStatus(property.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updatePropertyStatus(property.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {property.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePropertyStatus(property.id, 'sold')}
                              >
                                Mark as Sold
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={property.is_featured ? "default" : "outline"}
                              onClick={() => toggleFeatured(property.id, property.is_featured)}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              {property.is_featured ? 'Unfeature' : 'Feature'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Buyer Inquiries</CardTitle>
                  <Select value={inquiryStatusFilter} onValueChange={setInquiryStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="border rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-navy mb-2">
                            {inquiry.property_sales?.title || 'Property'}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Buyer Name</p>
                              <p className="font-medium">{inquiry.buyer_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium text-xs">{inquiry.buyer_email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Phone</p>
                              <p className="font-medium">{inquiry.buyer_phone}</p>
                            </div>
                          </div>
                          {inquiry.message && (
                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground">Message:</p>
                              <p className="text-sm">{inquiry.message}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={
                              inquiry.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              inquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                              inquiry.status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {inquiry.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Select
                            value={inquiry.status}
                            onValueChange={(status) => updateInquiryStatus(inquiry.id, status)}
                          >
                            <SelectTrigger className="w-full lg:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="negotiating">Negotiating</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
