

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addRequirement, updateRequirement, useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Requirement } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const brandSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().optional(),
});

const steelDetailSchema = z.object({
    size: z.string().min(1, "Size is required."),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});


const requirementFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  category: z.string({ required_error: "Please select a category." }).min(1, "Please select a category."),
  location: z.string().min(2, { message: "Location is required." }),
  description: z.string().optional(),
  brands: z.array(brandSchema).optional(),
  flexibleBrand: z.boolean().optional(),
  steelDetails: z.array(steelDetailSchema).optional(),
  steelBrands: z.array(z.string()).optional(),
  flexibleSteelBrand: z.boolean().optional(),
});

type RequirementFormValues = z.infer<typeof requirementFormSchema>;
type PhotoState = { file: File, preview: string };

interface RequirementFormProps {
    existingRequirement?: Requirement;
    initialCategory?: string;
}

const cementBrands = [
    { id: 'UltraTech', label: 'UltraTech' },
    { id: 'ACC', label: 'ACC' },
    { id: 'Shree Cement', label: 'Shree Cement' },
    { id: 'Birla', label: 'Birla' },
    { id: 'JK Cement', label: 'JK Cement' },
    { id: 'Dalmia', label: 'Dalmia' },
    { id: 'India Cements', label: 'India Cements' },
];

const steelBrandsList = [
    { id: 'Metroll TMT Bars', label: 'Metroll TMT Bars' },
    { id: 'Kaika TMT Bars', label: 'Kaika TMT Bars' },
    { id: 'Kay2 TMT Bars', label: 'Kay2 TMT Bars' },
];


export function RequirementForm({ existingRequirement, initialCategory }: RequirementFormProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(existingRequirement?.photos || []);


  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      title: existingRequirement?.title || '',
      category: existingRequirement?.category || initialCategory || '',
      location: existingRequirement?.location || '',
      description: existingRequirement?.description || '',
      brands: existingRequirement?.brands || [],
      flexibleBrand: existingRequirement?.flexibleBrand || false,
      steelDetails: existingRequirement?.steelDetails?.length ? existingRequirement.steelDetails : [],
      steelBrands: existingRequirement?.steelBrands || [],
      flexibleSteelBrand: existingRequirement?.flexibleSteelBrand || false,
    },
  });

  const { formState: { isSubmitting }, watch, setValue, getValues, control } = form;

  const watchedCategory = watch("category");
  
  const { fields: steelFields, append: appendSteel, remove: removeSteel } = useFieldArray({
    control,
    name: "steelDetails",
  });


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoState[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `${file.name} is over 5MB.` });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `Only JPG, PNG, and WEBP are accepted.` });
        return;
      }
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    });

    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = ''; // Reset file input
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingPhoto = (url: string) => {
    setExistingPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  }


  async function onSubmit(data: RequirementFormValues) {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    const newPhotosAsDataUrls = await Promise.all(
        photos.map(photo => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photo.file);
            });
        })
    );

    try {
        if (existingRequirement) {
            // Update logic
             await updateRequirement(existingRequirement.id, data, newPhotosAsDataUrls, existingPhotos);
             toast({
                title: 'Requirement Updated!',
                description: 'Your requirement has been successfully updated.',
             });
             router.push('/homeowner/dashboard');

        } else {
            // Create logic
            await addRequirement(data, newPhotosAsDataUrls);
            toast({
                title: 'Requirement Posted!',
                description: 'Shop owners in your area will now be able to see your requirement.',
                className: 'bg-accent text-accent-foreground'
            });
            router.push('/homeowner/dashboard');
        }
        router.refresh();

    } catch (error) {
      console.error('Requirement submission error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'An unexpected error occurred.' });
    }
  }
  
  const title = existingRequirement ? 'Edit Your Requirement' : 'Post a New Requirement';
  const description = existingRequirement ? 'Update the details of your requirement below.' : 'Fill out the form to get quotations from local shop owners.';
  const buttonText = existingRequirement ? 'Save Changes' : 'Post Requirement';


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Requirement Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 80 bags of ACC cement and 80 10mm TMT rods" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a material category" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cement">Cement</SelectItem>
                                            <SelectItem value="Steel">Steel (TMT Bars)</SelectItem>
                                            <SelectItem value="Bricks & Blocks">Bricks & Blocks</SelectItem>
                                            <SelectItem value="Sand & Aggregates">Sand & Aggregates</SelectItem>
                                            <SelectItem value="Plumbing">Plumbing & Sanitaryware</SelectItem>
                                            <SelectItem value="Electrical">Electrical Supplies</SelectItem>
                                            <SelectItem value="Paints & Finishes">Paints & Finishes</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Site Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Jayanagar, Bangalore" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watchedCategory === 'Cement' && (
                           <div className="md:col-span-2 space-y-6 border rounded-lg p-4">
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold">Cement Details</h3>
                                    <p className="text-sm text-muted-foreground">Specify the brands and quantities you need.</p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="brands"
                                    render={() => (
                                        <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Brands</FormLabel>
                                            <p className="text-sm text-muted-foreground">Select one or more brands.</p>
                                        </div>
                                        <div className="space-y-4">
                                        {cementBrands.map((brand) => (
                                            <FormField
                                                key={brand.id}
                                                control={form.control}
                                                name="brands"
                                                render={({ field }) => {
                                                    const selectedBrand = field.value?.find(b => b.id === brand.id);
                                                    return (
                                                    <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <FormControl>
                                                                <Checkbox
                                                                checked={field.value?.some(b => b.id === brand.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const currentBrands = getValues("brands") || [];
                                                                    if (checked) {
                                                                        setValue("brands", [...currentBrands, { id: brand.id, quantity: undefined }]);
                                                                    } else {
                                                                        setValue("brands", currentBrands.filter((b) => b.id !== brand.id));
                                                                    }
                                                                }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{brand.label}</FormLabel>
                                                        </div>
                                                        {selectedBrand && (
                                                            <div className="mt-2 sm:mt-0 w-full sm:w-auto sm:max-w-[150px]">
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Quantity (bags)"
                                                                        value={selectedBrand.quantity ?? ''}
                                                                        onChange={(e) => {
                                                                            const currentBrands = getValues("brands") || [];
                                                                            const updatedBrands = currentBrands.map(b => 
                                                                                b.id === brand.id ? { ...b, quantity: e.target.value === '' ? undefined : Number(e.target.value) } : b
                                                                            );
                                                                            setValue("brands", updatedBrands);
                                                                        }}
                                                                        className="h-9"
                                                                    />
                                                                </FormControl>
                                                            </div>
                                                        )}
                                                    </FormItem>
                                                )}}
                                            />
                                        ))}
                                        </div>
                                        <FormDescription className="pt-2">
                                            Please check the numbers again before submitting.
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="flexibleBrand"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Flexible Brand</FormLabel>
                                             <p className="text-sm text-muted-foreground">
                                                I am open to alternative brands.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Separator />
                           </div>
                        )}

                        {watchedCategory === 'Steel' && (
                            <div className="md:col-span-2 space-y-6 border rounded-lg p-4">
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold">Steel (TMT Bar) Details</h3>
                                    <p className="text-sm text-muted-foreground">Specify the sizes and quantities you need.</p>
                                </div>
                                <div className="space-y-4">
                                    {steelFields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-3 p-2 border-b">
                                            <FormField
                                                control={control}
                                                name={`steelDetails.${index}.size`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Size (mm)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="e.g., 8" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name={`steelDetails.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Quantity (rods)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} placeholder="e.g., 100" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSteel(index)} disabled={isSubmitting}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                 <FormDescription>
                                    Please check the numbers again before submitting.
                                </FormDescription>
                                <Button type="button" variant="outline" size="sm" onClick={() => appendSteel({ size: '', quantity: 0 })}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Another Size
                                </Button>
                                 <FormField
                                    control={form.control}
                                    name="steelBrands"
                                    render={() => (
                                        <FormItem className="pt-4">
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Preferred Brands</FormLabel>
                                            <p className="text-sm text-muted-foreground">Select one or more brands if you have a preference.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {steelBrandsList.map((item) => (
                                                <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="steelBrands"
                                                render={({ field }) => {
                                                    return (
                                                    <FormItem
                                                        key={item.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== item.id
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                        {item.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                    )
                                                }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="flexibleSteelBrand"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>Flexible Brand</FormLabel>
                                             <p className="text-sm text-muted-foreground">
                                                I am open to alternative brands.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Separator />
                            </div>
                        )}


                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Detailed Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your requirement in detail. Include brands, quantities, and any specific needs." {...field} disabled={isSubmitting} rows={6} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2 md:col-span-2">
                            <Label>Site Photos (Optional)</Label>
                            <p className="text-sm text-muted-foreground">Add photos of your site or material specifications.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {existingPhotos.map((url) => (
                                    <div key={url} className="relative group">
                                        <Image src={url} alt="Existing photo" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExistingPhoto(url)}
                                            disabled={isSubmitting}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {photos.map((photo, index) => (
                                    <div key={photo.preview} className="relative group">
                                        <Image src={photo.preview} alt="Upload preview" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removePhoto(index)}
                                            disabled={isSubmitting}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg ${isSubmitting ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                                        <div className="flex flex-col items-center justify-center text-center p-2">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground"><span className="font-semibold">Add photos</span></p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/webp" multiple disabled={isSubmitting} />
                                    </label>
                                </div> 
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {buttonText}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}

    

    
