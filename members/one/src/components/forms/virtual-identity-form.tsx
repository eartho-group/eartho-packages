"use client";
import * as z from "zod";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { useToast } from "../ui/use-toast";
import { faker } from '@faker-js/faker';
import { IdentitiesService } from '@/service/';
import { useSession } from "next-auth/react";
import FileUpload from "../upload/file-upload";
import UploadAvatar from "../upload/upload-avatar";

export const IMG_MAX_LIMIT = 3;

const formSchema = z.object({
  id: z.string().optional(),
  birthdate: z.string().optional(),
  address: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  gender: z.string().optional(),
  social: z.object({
    twitter: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  password: z.string().optional(),
  photoURL: z.string().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
});

type VirtualIdentityFormValues = z.infer<typeof formSchema>;

interface VirtualIdentityFormProps {
  initialData: any | null;
}

export const VirtualIdentityForm: React.FC<VirtualIdentityFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const title = initialData ? "Edit Virtual Identity" : "Create Virtual Identity";
  const description = initialData ? "Edit a virtual identity." : "Add a new virtual identity";
  const toastMessage = initialData ? "Virtual Identity updated." : "Virtual Identity created.";
  const action = initialData ? "Save changes" : "Create";

  const identityService = IdentitiesService();


  const defaultValues = initialData || {};

  const form = useForm<VirtualIdentityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: VirtualIdentityFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await identityService.update(data);
      } else {
        await identityService.create(data);
      }
      router.push(`/identities`);
      toast({
        title: "Success",
        description: toastMessage,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      // await axios.delete(`/api/${params.storeId}/virtual-identity/${params.id}`);
      // router.refresh();
      // router.push(`/${params.storeId}/virtual-identities`);
    } catch (error: any) {
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const generateFakeData = () => {
    form.setValue('firstName', faker.person.firstName());
    form.setValue('lastName', faker.person.lastName());
    form.setValue('email', faker.internet.email());
    form.setValue('username', faker.internet.userName());
    form.setValue('phone', faker.phone.number('+1##########')); // Standard phone format
    form.setValue('birthdate', faker.date.past(30, new Date()).toISOString().split('T')[0]);
    form.setValue('address.country', faker.location.country());
    form.setValue('address.city', faker.location.city());
    form.setValue('address.street', faker.location.streetAddress());
    form.setValue('address.state', faker.location.state());
    form.setValue('address.postalCode', faker.location.zipCode());
    form.setValue('gender', faker.person.sex());
    form.setValue('bio', faker.lorem.sentence());
    form.setValue('social.twitter', faker.internet.userName());
    form.setValue('social.website', faker.internet.url());
    form.setValue('social.facebook', faker.internet.userName());
    form.setValue('social.linkedin', faker.internet.userName());
    form.setValue('password', faker.internet.password());
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <Button disabled={loading} className="ml-auto" type="button" onClick={generateFakeData}>
            Generate Data
          </Button>
          <FormField
            control={form.control}
            name="photoURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <UploadAvatar
                    onChange={field.onChange}
                    file={field.value} 
                    loading={false} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="First Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Last Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Phone"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthdate</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Birthdate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Country"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="City"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Street"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="State"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Postal Code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Gender"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Bio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Twitter"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Website"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social.facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Facebook"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="LinkedIn"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
          <div className="flex justify-between">
            <Button disabled={loading} className="ml-auto" type="submit">
              {action}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
