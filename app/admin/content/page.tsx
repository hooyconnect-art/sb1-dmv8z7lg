'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Edit, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface WebsiteContent {
  id: string;
  section_key: string;
  title: string;
  content: string;
  is_active: boolean;
}

interface FeaturedListing {
  id: string;
  position: number;
  is_active: boolean;
  listing_id?: string;
  property_sale_id?: string;
  listings?: { id: string };
  property_sales?: { title: string };
}

export default function ContentPage() {
  const [contents, setContents] = useState<WebsiteContent[]>([]);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingContent, setEditingContent] = useState<WebsiteContent | null>(null);
  const [formData, setFormData] = useState({ section_key: '', title: '', content: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [contentsRes, featuredRes] = await Promise.all([
      supabase.from('website_content').select('*').order('section_key'),
      supabase.from('featured_listings').select('*, listings(id), property_sales(title)').eq('is_active', true),
    ]);

    if (contentsRes.data) setContents(contentsRes.data);
    if (featuredRes.data) setFeaturedListings(featuredRes.data);
    setLoading(false);
  };

  const openDialog = (content?: WebsiteContent) => {
    if (content) {
      setEditingContent(content);
      setFormData({
        section_key: content.section_key,
        title: content.title,
        content: content.content,
      });
    } else {
      setEditingContent(null);
      setFormData({ section_key: '', title: '', content: '' });
    }
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.section_key.trim() || !formData.title.trim()) {
      toast.error('Section key and title are required');
      return;
    }

    let error;
    if (editingContent) {
      const { error: updateError } = await supabase
        .from('website_content')
        .update({
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingContent.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('website_content')
        .insert({
          section_key: formData.section_key,
          title: formData.title,
          content: formData.content,
        });
      error = insertError;
    }

    if (error) {
      toast.error('Failed to save content');
    } else {
      toast.success('Content saved successfully');
      setShowDialog(false);
      fetchData();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('website_content')
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
            <h1 className="text-3xl font-bold text-brand-navy">Website Content</h1>
            <p className="text-muted-foreground mt-2">Manage homepage and content sections</p>
          </div>
          <Button onClick={() => openDialog()} className="bg-brand-green hover:bg-brand-green/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Content Section
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-brand-green" />
                  Content Sections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contents.map((content) => (
                    <div
                      key={content.id}
                      className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-green transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-brand-navy">{content.title}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            content.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {content.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Section: <code className="bg-gray-100 px-2 py-1 rounded">{content.section_key}</code>
                        </p>
                        {content.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{content.content}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(content)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={content.is_active ? 'outline' : 'secondary'}
                          onClick={() => toggleStatus(content.id, content.is_active)}
                        >
                          {content.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {contents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No content sections yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-brand-green" />
                  Featured Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featuredListings.map((featured) => (
                    <div
                      key={featured.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Star className="h-5 w-5 mr-3 text-yellow-500" />
                        <div>
                          <p className="font-medium">
                            {featured.property_sales?.title || `Listing #${featured.listing_id?.substring(0, 8)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">Position: {featured.position}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        Featured
                      </span>
                    </div>
                  ))}
                  {featuredListings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No featured listings currently active
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit Content Section' : 'Add Content Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Key</Label>
              <Input
                value={formData.section_key}
                onChange={(e) => setFormData({ ...formData, section_key: e.target.value })}
                placeholder="e.g., hero_section, about_us"
                disabled={!!editingContent}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier for this section (cannot be changed after creation)
              </p>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Section content..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-brand-green hover:bg-brand-green/90">
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
