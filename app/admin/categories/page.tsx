'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Plus, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyType {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
  is_active: boolean;
}

export default function CategoriesPage() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'property_type' | 'amenity'>('property_type');
  const [formData, setFormData] = useState({ name: '', category: '', icon: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [typesRes, amenitiesRes] = await Promise.all([
      supabase.from('property_types').select('*').order('name'),
      supabase.from('amenities').select('*').order('name'),
    ]);

    if (typesRes.data) setPropertyTypes(typesRes.data);
    if (amenitiesRes.data) setAmenities(amenitiesRes.data);
    setLoading(false);
  };

  const openDialog = (type: 'property_type' | 'amenity') => {
    setDialogType(type);
    setFormData({ name: '', category: '', icon: '' });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    let error;
    if (dialogType === 'property_type') {
      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }
      const res = await supabase
        .from('property_types')
        .insert({ name: formData.name, category: formData.category });
      error = res.error;
    } else {
      const res = await supabase
        .from('amenities')
        .insert({ name: formData.name, icon: formData.icon, category: formData.category });
      error = res.error;
    }

    if (error) {
      toast.error('Failed to add item');
    } else {
      toast.success('Item added successfully');
      setShowDialog(false);
      fetchData();
    }
  };

  const toggleStatus = async (type: string, id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from(type)
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchData();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Categories Management</h1>
            <p className="text-muted-foreground mt-2">Manage property types and amenities</p>
          </div>
        </div>

        <Tabs defaultValue="property_types" className="space-y-4">
          <TabsList>
            <TabsTrigger value="property_types">Property Types</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
          </TabsList>

          <TabsContent value="property_types">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Property Types</CardTitle>
                  <Button onClick={() => openDialog('property_type')} className="bg-brand-green hover:bg-brand-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propertyTypes.map((type) => (
                    <div
                      key={type.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-brand-green transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <Tag className="h-5 w-5 mr-2 text-brand-green" />
                          <div>
                            <p className="font-medium">{type.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{type.category}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={type.is_active ? 'outline' : 'secondary'}
                        className="w-full mt-2"
                        onClick={() => toggleStatus('property_types', type.id, type.is_active)}
                      >
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amenities">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Amenities</CardTitle>
                  <Button onClick={() => openDialog('amenity')} className="bg-brand-green hover:bg-brand-green/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Amenity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-brand-green transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <Wifi className="h-5 w-5 mr-2 text-brand-green" />
                          <div>
                            <p className="font-medium">{amenity.name}</p>
                            {amenity.category && (
                              <p className="text-sm text-muted-foreground capitalize">{amenity.category}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={amenity.is_active ? 'outline' : 'secondary'}
                        className="w-full mt-2"
                        onClick={() => toggleStatus('amenities', amenity.id, amenity.is_active)}
                      >
                        {amenity.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {dialogType === 'property_type' ? 'Property Type' : 'Amenity'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            {dialogType === 'property_type' && (
              <div>
                <Label>Category</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="rental">Rental</option>
                  <option value="hotel">Hotel</option>
                  <option value="guesthouse">Guesthouse</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
            )}
            {dialogType === 'amenity' && (
              <>
                <div>
                  <Label>Icon (optional)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Icon name"
                  />
                </div>
                <div>
                  <Label>Category (optional)</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., connectivity, comfort"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-brand-green hover:bg-brand-green/90">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
