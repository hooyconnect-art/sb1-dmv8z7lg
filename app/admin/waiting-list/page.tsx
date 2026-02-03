'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ListChecks, Search, MapPin } from 'lucide-react';

interface WaitingListEntry {
  id: string;
  listing_id: string;
  guest_id: string;
  created_at: string;
  listings?: {
    listing_type: string;
    hotels?: { name: string; city: string }[];
    guesthouses?: { title: string; city: string }[];
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function WaitingListManagement() {
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [filteredList, setFilteredList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWaitingList();
  }, []);

  useEffect(() => {
    filterList();
  }, [searchTerm, waitingList]);

  const fetchWaitingList = async () => {
    const { data, error } = await supabase
      .from('waiting_list')
      .select(`
        *,
        listings(
          listing_type,
          hotels(name, city),
          guesthouses(title, city)
        ),
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch waiting list');
      console.error(error);
    } else {
      setWaitingList(data || []);
      setFilteredList(data || []);
    }
    setLoading(false);
  };

  const filterList = () => {
    if (!searchTerm) {
      setFilteredList(waitingList);
      return;
    }

    const filtered = waitingList.filter((entry) => {
      const guestName = entry.profiles?.full_name || '';
      const guestEmail = entry.profiles?.email || '';
      const listingName =
        entry.listings?.listing_type === 'hotel'
          ? entry.listings?.hotels?.[0]?.name || ''
          : entry.listings?.guesthouses?.[0]?.title || '';

      return (
        guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listingName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredList(filtered);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Waiting List</h1>
            <p className="text-muted-foreground mt-2">
              View guests on waiting lists for unavailable properties
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <ListChecks className="h-5 w-5 text-brand-green" />
            <span className="font-semibold">{filteredList.length}</span>
            <span className="text-muted-foreground">
              of {waitingList.length} entries
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold text-brand-navy">{waitingList.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Hotels</p>
              <p className="text-2xl font-bold text-blue-600">
                {waitingList.filter((e) => e.listings?.listing_type === 'hotel').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Guesthouses</p>
              <p className="text-2xl font-bold text-purple-600">
                {waitingList.filter((e) => e.listings?.listing_type === 'guesthouse').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle>All Waiting List Entries</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              </div>
            ) : filteredList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Guest
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Email
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Property
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Type
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Location
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Joined List
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((entry) => {
                      const isHotel = entry.listings?.listing_type === 'hotel';
                      const propertyName = isHotel
                        ? entry.listings?.hotels?.[0]?.name
                        : entry.listings?.guesthouses?.[0]?.title;
                      const propertyCity = isHotel
                        ? entry.listings?.hotels?.[0]?.city
                        : entry.listings?.guesthouses?.[0]?.city;

                      return (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-medium text-brand-navy">
                              {entry.profiles?.full_name || 'Unknown'}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground">
                              {entry.profiles?.email || 'N/A'}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{propertyName || 'Unknown Property'}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm capitalize">
                              {entry.listings?.listing_type || 'N/A'}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                              <p className="text-sm">{propertyCity || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No waiting list entries found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
