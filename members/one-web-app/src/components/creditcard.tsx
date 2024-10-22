import { FC } from "react";
import Image from "next/image";

interface CreditCardProps {
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: string;
  cardExpYear: string;
  className?: string;
}

export const CreditCard: FC<CreditCardProps> = ({
  cardBrand,
  cardLast4,
  cardExpMonth,
  cardExpYear,
  className = "",
}) => {
  const getCardImage = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "/icons/payment/visa.svg";
      case "mastercard":
        return "/icons/payment/mastercard.svg";
      case "apple":
        return "/icons/payment/apple.svg";
      case "klarna":
        return "/icons/payment/klarna.svg";
      default:
        return "/icons/payment/default.png";
    }
  };

  return (
    <div className={`flex items-center p-1 ${className}`}>
      <Image
        src={getCardImage(cardBrand)}
        height={36}
        width={36}
        alt={`${cardBrand} Credit Card`}
        className="mr-3"
      />
      <div className="flex flex-col">
        <div className="text-sm">**** **** **** {cardLast4}</div>
        <div className="text-xs text-gray-600 text-left">
          Expires {cardExpMonth}/{cardExpYear}
        </div>
      </div>
    </div>
  );
};

interface OtherPaymentMethodProps {
  name: string;
  icon: string;
  className?: string;
}

export const OtherPaymentMethod: FC<OtherPaymentMethodProps> = ({
  name,
  icon,
  className = "",
}) => {
  const getIconImage = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "apple":
        return "/icons/payment/apple.svg";
      case "klarna":
        return "/icons/payment/klarna.svg";
      default:
        return "/icons/payment/paypal.svg";
    }
  };

  return (
    <div className={`flex items-center p-1 ${className}`}>
      <Image
        src={getIconImage(icon)}
        height={32}
        width={32}
        alt={name}
        className="mr-3"
      />
      <div className="flex flex-col">
        <div className="text-sm">{name}</div>
      </div>
    </div>
  );
};
