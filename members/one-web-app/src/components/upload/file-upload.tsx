"use client";
import { useDropzone } from "react-dropzone";
import { useMemo } from "react";
import { Trash } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface ImageUploadProps {
  onChange?: any;
  onRemove: (value: any[]) => void;
  value: any[];
  maxFiles?: number;
  width?: string;
}

export default function FileUpload({
  onChange,
  onRemove,
  value = [],
  maxFiles = 1,
  width = "w-80", // default width of 16rem
}: ImageUploadProps) {
  const { toast } = useToast();

  const onDeleteFile = (key: string) => {
    const files = value;
    let filteredFiles = files.filter((item) => item.key !== key);
    onRemove(filteredFiles);
  };

  const onUpdateFile = (newFiles: any[]) => {
    if (value.length + newFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `You can only upload up to ${maxFiles} image${maxFiles > 1 ? 's' : ''}.`,
      });
      return;
    }
    onChange([...value, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) => ({
        key: file.name,
        fileUrl: URL.createObjectURL(file),
      }));
      onUpdateFile(newFiles);
    },
  });

  const baseStyle = `flex flex-col items-center justify-center text-gray-400 outline-none overflow-hidden transition ease-in-out border border-dashed border-gray-400 p-5 text-center rounded-lg ${width}`;
  const acceptStyle = "border-green-400";
  const rejectStyle = "border-red-400";

  const style = useMemo(
    () => `${baseStyle} ${isDragAccept ? acceptStyle : ''} ${isDragReject ? rejectStyle : ''}`,
    [isDragAccept, isDragReject]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {!!value.length &&
          value.map((item) => (
            <div
              key={item?.key}
              className="relative w-[128px] h-[128px] rounded-md overflow-hidden border border-gray-300"
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  type="button"
                  onClick={() => onDeleteFile(item?.key)}
                  variant="outline"
                  size="sm"
                >
                  <Trash className="h-4 w-4 text-black hover:text-white" />
                </Button>
              </div>
              <div className="w-full h-full p-2">
                <Image
                  fill
                  className="object-contain"
                  alt="Image"
                  src={item?.fileUrl}
                />
              </div>
            </div>
          ))}
      </div>
      <div>
        {value.length < maxFiles && (
          <div {...getRootProps({ className: style })}>
            <input {...getInputProps()} />
            <p className="text-blue-500 font-medium">Choose files or drag and drop</p>
            <p className="text-gray-500">Images up to 4M</p>
          </div>
        )}
      </div>
    </div>
  );
}
