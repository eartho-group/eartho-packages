import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import IdentitySwitcher from "@/components/layout/identity-switcher";
import PaymentSwitcher from "@/components/layout/payment-switcher";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { fetchAccessData } from './fetchAccessData';
import { AccessService, FinanceService } from "@/service";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from 'next-intl';

const Badges: FC<{ badges: string[] }> = ({ badges }) => {
    const t = useTranslations('connect');
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {badges.map((badge, index) => (
                <Badge key={index} variant="outline" className="h-[32px]">
                    {badge}
                </Badge>
            ))}
        </div>
    );
};

const TermsAndPrivacy: FC = () => {
    const t = useTranslations('connect');
    return (
        <p className="mt-4 mb-6 text-sm text-muted-foreground">
            {t('agreeToTerms')}{" "}
            <Link
                href="https://www.eartho.io/legal/terms-of-service"
                className="underline underline-offset-4 hover:text-primary"
            >
                {t('termsOfService')}
            </Link>{" "}
            {t('and')}{" "}
            <Link
                href="https://www.eartho.io/legal/privacy-policy"
                className="underline underline-offset-4 hover:text-primary"
            >
                {t('privacyPolicy')}
            </Link>
            .
        </p>
    );
};

interface ApprovalComponentProps { }
const ApprovalComponent: FC<ApprovalComponentProps> = ({ }) => {
    const t = useTranslations('connect');
    const [title, setTitle] = useState<string>();
    const [trustBadges, setTrustBadges] = useState<string[] | undefined>();
    const [termsBadges, setTermsBadges] = useState<string[] | undefined>();
    const [identities, setIdentities] = useState<any | undefined>();
    const [wallet, setWallet] = useState<any | undefined>(false);
    const [hasPayment, setHasPayment] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [elementToken, setElementToken] = useState<string>('');

    var currentPaymentMethod: any | undefined

    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const accessId = searchParams?.get("access_id");
    const clientId = searchParams?.get("client_id");

    const accessService = AccessService();

    useEffect(() => {
        if (!session?.accessToken || !accessId || !clientId) return;

        fetchAccessData(session.accessToken, accessId, clientId, t)
            .then(({ title, trustBadges, termsBadges, identities, wallet, hasPayment }) => {
                setTitle(title);
                setTrustBadges(trustBadges);
                setTermsBadges(termsBadges);
                setIdentities(identities);
                setWallet(wallet);
                setHasPayment(hasPayment);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });

        const financeService = FinanceService();
        financeService.getPaymentToken().then((t) => setElementToken(t));

    }, [accessId, session?.accessToken, t]);

    return (
        <div className="p-2">
            <h2 className="text-2xl font-medium mb-2">
                {t('connectTo')} <br />
                <span className="text-[#47A3EB]">{title || <Skeleton className="h-[32px]" />}</span>
            </h2>
            <div className="mt-10">
                <h3 className="text-sm font-medium">{t('trustTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('trustDescription')}</p>
                {trustBadges ? <Badges badges={trustBadges} /> : <Skeleton className="h-[32px]" />}
            </div>
            <div className="mt-6">
                <h3 className="text-sm font-medium">{t('termsTitle')}</h3>
                <p className="text-sm text-muted-foreground">{t('termsDescription')}</p>
                {termsBadges ? <Badges badges={termsBadges} /> : <Skeleton className="h-[32px]" />}
            </div>
            <TermsAndPrivacy />
            {hasPayment && <PaymentSwitcher className="w-full" wallet={wallet} onPaymentMethodChange={x => { currentPaymentMethod = x }} elementToken={elementToken} />}
            <IdentitySwitcher identities={identities} className="w-full mt-4" />
            <Button className="mt-4 w-full" onClick={onConfirm} disabled={isLoading}>
                {isLoading && <Icons.spinner className="animate-spin h-4" />}  {t('confirm')}
            </Button>
        </div>
    );

    async function onConfirm(e: any) {
        setIsLoading(true);
        try {
            if (!searchParams) return

            const nonce = searchParams.get("nonce");
            const state = searchParams.get("state");
            const responseMode = searchParams.get("response_mode") || '';
            const redirectUri = searchParams.get("redirect_uri");

            if (!clientId) return
            if (!accessId) return
            if (!nonce) return
            if (!state) return
            if (!redirectUri) return

            const data = await accessService.connect(accessId, currentPaymentMethod?.value)
            if (data.status === 'connected') {
                if (nonce && state) {
                    data.type = "authentication"
                    const code = await accessService.getCode(clientId, accessId, nonce, state, responseMode, redirectUri)
                    await accessService.publishCode(responseMode, code, redirectUri)
                }
            }
        } catch (e) {
            console.log(e);
            setIsLoading(false);
            toast({
                variant: "destructive",
                title: t('errorTitle'),
                description: t('errorDescription'),
            });
        }
    }
};

export default ApprovalComponent;
