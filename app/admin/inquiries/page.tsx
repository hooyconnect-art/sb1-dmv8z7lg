'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Mail, Phone, Home } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Inquiry {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  status: string;
  notes: string;
  created_at: string;
  property_sale_id: string;
  property_sales?: {
    title: string;
    price: number;
  };
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales_inquiries')
        .select(`
          *,
          property_sales(title, price)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching inquiries:', error);
        toast.error('Failed to load inquiries');
        setInquiries([]);
      } else {
        setInquiries(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
      setInquiries([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('sales_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchInquiries();
    }
  };

  const saveNotes = async () => {
    if (!selectedInquiry) return;

    const { error } = await supabase
      .from('sales_inquiries')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', selectedInquiry.id);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
      setSelectedInquiry(null);
      fetchInquiries();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      negotiating: 'bg-orange-100 text-orange-800',
      closed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return variants[status] || variants.new;
  };

  const filteredInquiries = inquiries.filter(i =>
    i.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
    i.buyer_email.toLowerCase().includes(search.toLowerCase()) ||
    i.property_sales?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Sales Inquiries</h1>
            <p className="text-muted-foreground mt-2">Manage property sale inquiries</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-brand-navy">{inquiry.buyer_name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {inquiry.buyer_email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {inquiry.buyer_phone}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusBadge(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm">
                        <Home className="h-4 w-4 mr-2 text-brand-green" />
                        <span className="font-medium">{inquiry.property_sales?.title}</span>
                        <span className="mx-2">•</span>
                        <span className="text-muted-foreground">
                          ${inquiry.property_sales?.price.toLocaleString()}
                        </span>
                      </div>

                      {inquiry.message && (
                        <p className="text-sm text-muted-foreground italic">"{inquiry.message}"</p>
                      )}

                      {inquiry.notes && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Admin Notes:</p>
                          <p className="text-sm text-muted-foreground">{inquiry.notes}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Received: {format(new Date(inquiry.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Select
                        value={inquiry.status}
                        onValueChange={(value) => updateStatus(inquiry.id, value)}
                      >
                        <SelectTrigger>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setNotes(inquiry.notes || '');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {inquiry.notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredInquiries.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inquiries found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add notes about this inquiry..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} className="bg-brand-green hover:bg-brand-green/90">
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
