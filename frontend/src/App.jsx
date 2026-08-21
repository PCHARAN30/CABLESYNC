import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PinEntry from './pages/PinEntry';
import CustomerList from './pages/CustomerList';
import CustomerDetails from './pages/CustomerDetails';
import TodaysCollection from './pages/TodaysCollection';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import ImportCustomers from "./pages/ImportCustomers";
import Reports from "./pages/Reports";
import Export from "./pages/Export";
import PendingDues from "./pages/PendingDues";
import NotFound from "./pages/NotFound";
import CollectionReport from "./pages/CollectionReport";
import ToastContainer from './components/ToastContainer';
import Settings from './pages/Settings';
import MobileNav from './components/MobileNav';

function RequirePin({ children }) {
  const hasPin = Boolean(sessionStorage.getItem('cablesync_pin'));
  return hasPin ? children : <Navigate to="/pin" replace />;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/pin" element={<PinEntry />} />
          <Route
            path="/"
            element={
              <RequirePin>
                <Navigate to="/customers" replace />
              </RequirePin>
            }
          />
          <Route
            path="/customers"
            element={
              <RequirePin>
                <CustomerList />
              </RequirePin>
            }
          />
          <Route
            path="/customers/new"
            element={
              <RequirePin>
                <AddCustomer />
              </RequirePin>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RequirePin>
                <CustomerDetails />
              </RequirePin>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <RequirePin>
                <EditCustomer />
              </RequirePin>
            }
          />
          <Route
            path="/import"
            element={
              <RequirePin>
                <ImportCustomers />
              </RequirePin>
            }
          />
          <Route
            path="/reports"
            element={
              <RequirePin>
                <Reports />
              </RequirePin>
            }
          />
          <Route path="/reports/pending-dues" element={<RequirePin><PendingDues /></RequirePin>} />
          <Route path="/reports/daily" element={<RequirePin><TodaysCollection /></RequirePin>} />
          <Route path="/reports/:type" element={<RequirePin><CollectionReport /></RequirePin>} />
          <Route
            path="/export"
            element={
              <RequirePin>
                <Export />
              </RequirePin>
            }
          />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/settings"
            element={
              <RequirePin>
                <Settings />
              </RequirePin>
            }
          />
        </Routes>
        <MobileNav />
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}
