import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { HospitalInventoryProvider } from './context/HospitalInventoryContext';
import { HospitalRequestProvider } from './context/HospitalRequestContext';
import { Layout } from './components/layout/Layout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SetupInventoryPage } from './pages/SetupInventoryPage';
import { SetupCompletePage } from './pages/SetupCompletePage';
import { DashboardPreviewPage } from './pages/DashboardPreviewPage';

// Hospital Dashboard & Inventory Pages (Phase 2 - Step 4 & 5)
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { HospitalInventoryPage } from './pages/HospitalInventoryPage';

// Hospital Blood Request Pages (Phase 2 - Step 6 & 7)
import { HospitalRequestsPage } from './pages/hospital/HospitalRequestsPage';
import { CreateBloodRequestPage } from './pages/hospital/CreateBloodRequestPage';
import { BloodRequestDetailsPage } from './pages/hospital/BloodRequestDetailsPage';

// Hospital Predictive Intelligence Pages (Phase 4 - Steps 12-15)
import { PredictiveIntelligencePage } from './pages/hospital/PredictiveIntelligencePage';

// Steps 8-20 Pages: Usage, Transactions, Reconciliation, Analytics, Matching, Admin
import { RecordBloodUsagePage } from './pages/hospital/RecordBloodUsagePage';
import { TransactionHistoryPage } from './pages/hospital/TransactionHistoryPage';
import { InventoryReconciliationPage } from './pages/hospital/InventoryReconciliationPage';
import { UsageAnalyticsPage } from './pages/hospital/UsageAnalyticsPage';
import { BloodBankMatchingPage } from './pages/hospital/BloodBankMatchingPage';
import { AdminRefillRequestsPage } from './pages/admin/AdminRefillRequestsPage';
import { HospitalRouteGuard } from './components/hospital/HospitalRouteGuard';

// Phase 6 Admin Network Command Center Pages & Guard
import { AppStoreProvider } from './store/appStore';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AdminCommandCenterPage } from './pages/admin/AdminCommandCenterPage';
import { AdminOrganizationsPage } from './pages/admin/AdminOrganizationsPage';
import { AdminOrganizationDetailsPage } from './pages/admin/AdminOrganizationDetailsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminNetworkAnalyticsPage } from './pages/admin/AdminNetworkAnalyticsPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { HospitalStaffPage } from './pages/hospital/HospitalStaffPage';
import { HospitalStaffDashboardPage } from './pages/hospital/HospitalStaffDashboardPage';
import { BloodBankDashboardPage } from './pages/bloodbank/BloodBankDashboardPage';
import { BloodBankRouteGuard } from './components/bloodbank/BloodBankRouteGuard';
import { HospitalRegisterPage } from './pages/hospital/HospitalRegisterPage';
import { HospitalLayout } from './components/hospital/HospitalLayout';

// Seva Sathi Modules
import { NearExpiryRescuePage } from './pages/nearexpiry/NearExpiryRescuePage';
import { SmartInventoryImportPage } from './pages/inventory/SmartInventoryImportPage';
import { LiveInventoryNetworkPage } from './pages/network/LiveInventoryNetworkPage';
import { DonorPortalPage } from './pages/donor/DonorPortalPage';
import { DonorRegistrationsPage } from './pages/donor/DonorRegistrationsPage';
import { DonorNotificationsPage } from './pages/donor/DonorNotificationsPage';
import { NGOCampaignsPage } from './pages/ngo/NGOCampaignsPage';
import { NGORouteGuard } from './components/ngo/NGORouteGuard';
import { DonorRouteGuard } from './components/donor/DonorRouteGuard';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { OrganizerTelemetryPage } from './pages/organizer/OrganizerTelemetryPage';
import { SevaSathiAIAssistant } from './components/ai/SevaSathiAIAssistant';

export function App() {
  return (
    <Router>
      <AppStoreProvider>
        <AuthProvider>
          <RegistrationProvider>
            <HospitalInventoryProvider>
            <HospitalRequestProvider>
              <Routes>
                {/* Hospital Command Center Routes (Custom Portal Layout + Route Guard) */}
                <Route
                  path="/hospital/dashboard"
                  element={
                    <HospitalRouteGuard>
                      <HospitalDashboardPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/network"
                  element={
                    <HospitalRouteGuard>
                      <HospitalLayout pageTitle="Live Blood-Bank Network">
                        <LiveInventoryNetworkPage />
                      </HospitalLayout>
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/near-expiry"
                  element={
                    <HospitalRouteGuard>
                      <HospitalLayout pageTitle="Near-Expiry Blood Rescue">
                        <NearExpiryRescuePage />
                      </HospitalLayout>
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/inventory/import"
                  element={
                    <HospitalRouteGuard>
                      <HospitalLayout pageTitle="Smart Inventory Import">
                        <SmartInventoryImportPage />
                      </HospitalLayout>
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/inventory"
                  element={
                    <HospitalRouteGuard>
                      <HospitalInventoryPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests"
                  element={
                    <HospitalRouteGuard>
                      <HospitalRequestsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/new"
                  element={
                    <HospitalRouteGuard>
                      <CreateBloodRequestPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/:requestId"
                  element={
                    <HospitalRouteGuard>
                      <BloodRequestDetailsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/predictions"
                  element={
                    <HospitalRouteGuard>
                      <PredictiveIntelligencePage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/usage/new"
                  element={
                    <HospitalRouteGuard>
                      <RecordBloodUsagePage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/transactions"
                  element={
                    <HospitalRouteGuard>
                      <TransactionHistoryPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/inventory/reconciliation"
                  element={
                    <HospitalRouteGuard>
                      <InventoryReconciliationPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/analytics/usage"
                  element={
                    <HospitalRouteGuard>
                      <UsageAnalyticsPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/requests/:requestId/matching"
                  element={
                    <HospitalRouteGuard>
                      <BloodBankMatchingPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/staff"
                  element={
                    <HospitalRouteGuard adminOnly>
                      <HospitalStaffPage />
                    </HospitalRouteGuard>
                  }
                />
                <Route
                  path="/hospital/staff/dashboard"
                  element={
                    <HospitalRouteGuard>
                      <HospitalStaffDashboardPage />
                    </HospitalRouteGuard>
                  }
                />
                {/* Blood Bank Operations Route */}
                <Route
                  path="/blood-bank/dashboard"
                  element={
                    <BloodBankRouteGuard>
                      <BloodBankDashboardPage />
                    </BloodBankRouteGuard>
                  }
                />
                <Route
                  path="/blood-bank/near-expiry"
                  element={
                    <BloodBankRouteGuard>
                      <Layout>
                        <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                          <NearExpiryRescuePage />
                        </div>
                      </Layout>
                    </BloodBankRouteGuard>
                  }
                />
                <Route
                  path="/blood-bank/inventory"
                  element={
                    <BloodBankRouteGuard>
                      <Layout>
                        <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                          <SmartInventoryImportPage />
                        </div>
                      </Layout>
                    </BloodBankRouteGuard>
                  }
                />
                {/* Phase 6: Admin Network Command Center Routes (Admin Layout + Admin Route Guard) */}
                <Route
                  path="/admin/command-center"
                  element={
                    <AdminRouteGuard>
                      <AdminCommandCenterPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={<Navigate to="/admin/command-center" replace />}
                />
                <Route
                  path="/admin/organizations"
                  element={
                    <AdminRouteGuard>
                      <AdminOrganizationsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/organizations/:id"
                  element={
                    <AdminRouteGuard>
                      <AdminOrganizationDetailsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <AdminRouteGuard>
                      <AdminAuditLogsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/network-analytics"
                  element={
                    <AdminRouteGuard>
                      <AdminNetworkAnalyticsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/alerts"
                  element={
                    <AdminRouteGuard>
                      <AdminAlertsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/activity"
                  element={
                    <AdminRouteGuard>
                      <AdminActivityPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminRouteGuard>
                      <AdminSettingsPage />
                    </AdminRouteGuard>
                  }
                />
                <Route
                  path="/admin/refill-requests"
                  element={
                    <AdminRouteGuard>
                      <AdminRefillRequestsPage />
                    </AdminRouteGuard>
                  }
                />

              {/* Public Marketing & Onboarding Routes (Public Layout) */}
              <Route
                path="/"
                element={
                  <Layout>
                    <LandingPage />
                  </Layout>
                }
              />
              <Route
                path="/how-it-works"
                element={
                  <Layout>
                    <HowItWorksPage />
                  </Layout>
                }
              />
              <Route
                path="/network"
                element={
                  <Layout>
                    <LiveInventoryNetworkPage />
                  </Layout>
                }
              />
              <Route
                path="/near-expiry"
                element={
                  <BloodBankRouteGuard>
                    <Layout>
                      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                        <NearExpiryRescuePage />
                      </div>
                    </Layout>
                  </BloodBankRouteGuard>
                }
              />
              <Route
                path="/donor/portal"
                element={
                  <DonorRouteGuard>
                    <DonorPortalPage />
                  </DonorRouteGuard>
                }
              />
              <Route
                path="/donor/drives"
                element={
                  <DonorRouteGuard>
                    <DonorPortalPage />
                  </DonorRouteGuard>
                }
              />
              <Route
                path="/donor/registrations"
                element={
                  <DonorRouteGuard>
                    <DonorRegistrationsPage />
                  </DonorRouteGuard>
                }
              />
              <Route
                path="/donor/passes"
                element={
                  <DonorRouteGuard>
                    <DonorRegistrationsPage />
                  </DonorRouteGuard>
                }
              />
              <Route
                path="/donor/notifications"
                element={
                  <DonorRouteGuard>
                    <DonorNotificationsPage />
                  </DonorRouteGuard>
                }
              />
              <Route
                path="/ngo/campaigns"
                element={
                  <NGORouteGuard>
                    <Layout>
                      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                        <NGOCampaignsPage />
                      </div>
                    </Layout>
                  </NGORouteGuard>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <Layout>
                    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                      <NGOCampaignsPage />
                    </div>
                  </Layout>
                }
              />
              <Route
                path="/organizer/telemetry"
                element={
                  <NGORouteGuard>
                    <Layout>
                      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                        <OrganizerTelemetryPage />
                      </div>
                    </Layout>
                  </NGORouteGuard>
                }
              />
              <Route
                path="/telemetry"
                element={
                  <NGORouteGuard>
                    <Layout>
                      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                        <OrganizerTelemetryPage />
                      </div>
                    </Layout>
                  </NGORouteGuard>
                }
              />
              <Route
                path="/inventory/import"
                element={
                  <BloodBankRouteGuard>
                    <Layout>
                      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                        <SmartInventoryImportPage />
                      </div>
                    </Layout>
                  </BloodBankRouteGuard>
                }
              />
              <Route
                path="/unauthorized"
                element={<UnauthorizedPage />}
              />
              <Route
                path="/about"
                element={
                  <Layout>
                    <AboutPage />
                  </Layout>
                }
              />
              <Route
                path="/login"
                element={
                  <Layout>
                    <LoginPage />
                  </Layout>
                }
              />
              <Route
                path="/register"
                element={
                  <Layout>
                    <RegisterPage />
                  </Layout>
                }
              />
              <Route
                path="/register/hospital"
                element={<HospitalRegisterPage />}
              />
              <Route
                path="/setup-inventory"
                element={
                  <Layout>
                    <SetupInventoryPage />
                  </Layout>
                }
              />
              <Route
                path="/setup-complete"
                element={
                  <Layout>
                    <SetupCompletePage />
                  </Layout>
                }
              />
              <Route
                path="/dashboard-preview"
                element={
                  <Layout>
                    <DashboardPreviewPage />
                  </Layout>
                }
              />

              {/* Fallback unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SevaSathiAIAssistant />
          </HospitalRequestProvider>
        </HospitalInventoryProvider>
      </RegistrationProvider>
    </AuthProvider>
    </AppStoreProvider>
  </Router>
);
}

export default App;
