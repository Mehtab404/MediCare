import Header from "@/components/Header";
import AppointmentsPanel from "@/components/admin/AppointmentsPanel";
import DoctorsPanel from "@/components/admin/DoctorsPanel";
import OverviewPanel from "@/components/admin/OverviewPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">Administration</h1>
        <p className="text-muted-foreground">Manage doctors, appointments and accounts</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewPanel />
        </TabsContent>
        <TabsContent value="doctors">
          <DoctorsPanel />
        </TabsContent>
        <TabsContent value="appointments">
          <AppointmentsPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </main>
  </div>
);

export default AdminDashboard;
