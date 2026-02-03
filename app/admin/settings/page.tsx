'use client';

import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Save, Bell, Shield, Database } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newListingAlerts, setNewListingAlerts] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage platform settings and configurations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-brand-green" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Configure email alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for platform activity
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-listing-alerts">New Listing Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new listings are submitted
                  </p>
                </div>
                <Switch
                  id="new-listing-alerts"
                  checked={newListingAlerts}
                  onCheckedChange={setNewListingAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-alerts">Booking Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new bookings
                  </p>
                </div>
                <Switch
                  id="booking-alerts"
                  checked={bookingAlerts}
                  onCheckedChange={setBookingAlerts}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                className="w-full bg-brand-green hover:bg-brand-green/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-brand-green" />
                <CardTitle>Platform Settings</CardTitle>
              </div>
              <CardDescription>
                System-wide platform configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable public access to the platform
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  defaultValue="HoyConnect"
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  placeholder="support@hoyconnect.com"
                  className="max-w-md"
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                className="w-full bg-brand-green hover:bg-brand-green/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Platform Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-brand-green" />
              <CardTitle>Database Statistics</CardTitle>
            </div>
            <CardDescription>
              Overview of database usage and storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-2xl font-bold text-brand-navy">12</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-brand-navy">245 MB</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">API Requests (Today)</p>
                <p className="text-2xl font-bold text-brand-navy">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Quick Actions</CardTitle>
            <CardDescription className="text-yellow-700">
              Administrative tasks and utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Export All Users Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Export Bookings Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Generate Revenue Report
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50">
              Clear System Cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
