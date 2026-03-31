import "../styles/globals.css";
import { useRouter } from "next/router";
import { AuthProvider } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const NO_SIDEBAR = ["/login", "/register"];

function Layout({ Component, pageProps }) {
  const router = useRouter();
  const hideSidebar =
    NO_SIDEBAR.includes(router.pathname) ||
    router.pathname.startsWith("/reader/");

  return (
    <>
      {!hideSidebar && <Sidebar />}
      <Component {...pageProps} />
    </>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
