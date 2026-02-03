'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home } from 'lucide-react';

export function BecomeHostForm() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const { error: insertError } = await supabase
        .from('host_requests')
        .insert([
          {
            user_id: user?.id,
            full_name: fullName,
            phone: phone,
            property_type: propertyType,
            location: location,
            status: 'pending'
          }
        ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFullName('');
      setPhone('');
      setPropertyType('');
      setLocation('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-brand-green" />
          <CardTitle className="text-brand-navy">Become a Host</CardTitle>
        </div>
        <CardDescription>
          Want to list your property on HoyConnect? Submit your request below and our team will review it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            <p className="font-semibold mb-1">Request submitted successfully!</p>
            <p className="text-sm">Our team will review your request and get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType} required>
                <SelectTrigger className="focus:ring-brand-green focus:border-brand-green">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Property Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
