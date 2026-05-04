import { Outlet } from "react-router-dom";
import WebsiteHeader from "./WebsiteHeader";
import WebsiteFooter from "./WebsiteFooter";
import FloatingSocials from "./FloatingSocials";

const WebsiteLayout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <WebsiteHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <WebsiteFooter />
    <FloatingSocials />
  </div>
);

export default WebsiteLayout;
