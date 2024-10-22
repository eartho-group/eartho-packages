'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LanguageChanger() {
  const [locale, setLocale] = useState('en');
  const router = useRouter();

  useEffect(() => {
    let storedLocale = Cookies.get('NEXT_LOCALE');
    if (!storedLocale) return;
    setLocale(storedLocale);
  }, []);

  const handleChange = (selectedLocale: string) => {
    setLocale(selectedLocale);
    Cookies.set('NEXT_LOCALE', selectedLocale, { expires: 365 }); // Set the cookie for 1 year
    router.refresh(); // Refresh the page to reflect the locale change
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="ja">日本語</SelectItem>
        <SelectItem value="zh">中文</SelectItem>
        <SelectItem value="hi">हिन्दी</SelectItem>
        <SelectItem value="ar">العربية</SelectItem>
        <SelectItem value="bn">বাংলা</SelectItem>
        <SelectItem value="pt">Português</SelectItem>
        <SelectItem value="ru">Русский</SelectItem>
        <SelectItem value="he">עברית</SelectItem>
      </SelectContent>
    </Select>
  );
}
