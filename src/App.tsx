import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider } from '@/context/StoreContext';
import { OrderWizardProvider } from '@/context/OrderWizardContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// 18 Public Pages (Part 4)
import { HomePage } from '@/pages/public/HomePage';
import { SignCategoriesPage } from '@/pages/public/SignCategoriesPage';
import { ProductListingPage } from '@/pages/public/ProductListingPage';
import { TemplateGalleryPage } from '@/pages/public/TemplateGalleryPage';
import { TemplateDetailsPage } from '@/pages/public/TemplateDetailsPage';
import { CustomOrderWizardPage } from '@/pages/public/CustomOrderWizardPage';
import { OrderSummaryPage } from '@/pages/public/OrderSummaryPage';
import { OrderConfirmationPage } from '@/pages/public/OrderConfirmationPage';
import { OrderTrackingPage } from '@/pages/public/OrderTrackingPage';
import {
  CustomerProfilePage,
  FavoritesPage,
  LoginPage,
  MyOrdersPage,
  RegisterPage,
} from '@/pages/public/CustomerAuthPages';
import {
  ContactPage,
  FaqPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from '@/pages/public/StaticInfoPages';

// 19 Admin Pages (Part 4 & Part 18)
import {
  AdminDashboardPage,
  AdminLoginPage,
  AdminManageOrdersPage,
} from '@/pages/admin/AdminDashboardAndAuth';
import {
  AdminManageCategoriesPage,
  AdminManageSignTypesPage,
  AdminManageStylesPage,
  AdminManageTemplatesPage,
} from '@/pages/admin/AdminCatalogManagement';
import {
  AdminManageDecorationCategoriesPage,
  AdminManageDecorationColorsPage,
  AdminManageDecorationsPage,
  AdminManageFormFieldsPage,
} from '@/pages/admin/AdminDecorationsAndFields';
import {
  AdminActivityLogsPage,
  AdminManageCustomersPage,
  AdminManagePricingPage,
  AdminManagePromotionsPage,
  AdminManageReviewsPage,
  AdminManageSiteSettingsPage,
  AdminManageWebsiteContentPage,
  AdminUserManagementPage,
} from '@/pages/admin/AdminOperationsAndSettings';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <OrderWizardProvider>
          <ScrollToTop />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: 'Prompt, Noto Sans Thai, sans-serif',
                borderRadius: '16px',
              },
            }}
          />
          <Routes>
            {/* Public Storefront Routes (18 Pages) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<SignCategoriesPage />} />
              <Route path="/products" element={<ProductListingPage />} />
              <Route path="/templates" element={<TemplateGalleryPage />} />
              <Route path="/templates/:code" element={<TemplateDetailsPage />} />
              <Route path="/order-wizard" element={<CustomOrderWizardPage />} />
              <Route path="/order-summary" element={<OrderSummaryPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/track-order" element={<OrderTrackingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<CustomerProfilePage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
            </Route>

            {/* Admin Auth Route (#1 Admin Login) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Protected Backoffice Routes (#2 - #19 Admin Pages) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="categories" element={<AdminManageCategoriesPage />} />
              <Route path="sign-types" element={<AdminManageSignTypesPage />} />
              <Route path="styles" element={<AdminManageStylesPage />} />
              <Route path="templates" element={<AdminManageTemplatesPage />} />
              <Route path="decoration-colors" element={<AdminManageDecorationColorsPage />} />
              <Route
                path="decoration-categories"
                element={<AdminManageDecorationCategoriesPage />}
              />
              <Route path="decorations" element={<AdminManageDecorationsPage />} />
              <Route path="form-fields" element={<AdminManageFormFieldsPage />} />
              <Route path="orders" element={<AdminManageOrdersPage />} />
              <Route path="customers" element={<AdminManageCustomersPage />} />
              <Route path="pricing" element={<AdminManagePricingPage />} />
              <Route path="promotions" element={<AdminManagePromotionsPage />} />
              <Route path="reviews" element={<AdminManageReviewsPage />} />
              <Route path="website-content" element={<AdminManageWebsiteContentPage />} />
              <Route path="site-settings" element={<AdminManageSiteSettingsPage />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="activity-logs" element={<AdminActivityLogsPage />} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OrderWizardProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
