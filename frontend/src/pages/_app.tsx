import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar, Notifications } from '@/components';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { LandingPage } from '@/components/LandingPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { connected } = useWallet();
    const router = useRouter();

    // Allow access to home page without wallet
    if (router.pathname === '/') {
        return (
            <>
                <Navbar />
                <Notifications />
                <main>
                    {children}
                </main>
            </>
        );
    }

    if (!connected) {
        return <LandingPage />;
    }

    return (
        <>
            <Navbar />
            <Notifications />
            <main>
                {children}
            </main>
        </>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WalletProvider>
            <Head>
                <title>EquiClear - Decentralized Dutch Auctions on Aleo</title>
                <meta name="description" content="Privacy-preserving Dutch auction protocol with uniform clearing price on Aleo testnet" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.svg" />
            </Head>
            <AuthGuard>
                <Component {...pageProps} />
            </AuthGuard>
        </WalletProvider>
    );
}
