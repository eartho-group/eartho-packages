"use client";

import * as React from "react";
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Identity = {
  id: string;
  photoURL?: string;
  displayName?: string;
  firstName?: string;
};

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface IdentitySwitcherProps extends PopoverTriggerProps {
  identities: {
    profile: Identity;
    virtualIdentities: Identity[];
  };
}

const IdentitySwitcher: React.FC<IdentitySwitcherProps> = ({ identities, className }) => {
  const [open, setOpen] = React.useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<Identity | null>(null);
  const router = useRouter();
  const t = useTranslations('components.identitySwitcher');

  const initialGroups = React.useMemo(() => [
    { label: t('personalAccount'), identityList: [] as Identity[] },
    { label: t('virtualIdentity'), identityList: [] as Identity[] },
  ], [t]);

  const [groups, setGroups] = React.useState(initialGroups);

  React.useEffect(() => {
    if (!identities?.profile) return;

    const updatedGroups = [...initialGroups];
    updatedGroups[0].identityList = [identities.profile];
    updatedGroups[1].identityList = identities.virtualIdentities || [];

    setGroups(updatedGroups);
    setSelectedTeam(identities.profile);
  }, [identities, initialGroups]);

  function getName(identity?: Identity | null) {
    return identity?.displayName || identity?.firstName || "";
  }

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={t('selectIdentity')}
            className={cn("w-[200px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={selectedTeam?.photoURL || ""}
                alt={getName(selectedTeam)}
                className="grayscale"
              />
              <AvatarFallback>{(selectedTeam?.displayName || selectedTeam?.firstName)?.[0]}</AvatarFallback>
            </Avatar>
            {getName(selectedTeam)}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder={t('searchIdentity')} />
              <CommandEmpty>{t('noIdentityFound')}</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.identityList.map((identity) => (
                    <CommandItem
                      key={identity.id}
                      onSelect={() => {
                        setSelectedTeam(identity);
                        setOpen(false);
                      }}
                      className="text-sm"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={identity.photoURL || ""}
                          alt={identity.displayName || ""}
                          className="grayscale"
                        />
                        <AvatarFallback>{getName(identity)?.[0]}</AvatarFallback>
                      </Avatar>
                      {getName(identity)}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTeam?.id === identity.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewTeamDialog(true);
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    {t('createIdentity')}
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createIdentity')}</DialogTitle>
          <DialogDescription>{t('createIdentityDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" onClick={() => router.push('/identities')}>
            {t('continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default IdentitySwitcher;
