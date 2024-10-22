import { useDropzone, DropzoneOptions } from "react-dropzone";
import { useMemo, CSSProperties, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { FileService } from "service"; // Import FileService

const baseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "16px",
  color: "#bdbdbd",
  outline: "none",
  overflow: "hidden",
  transition: "border .24s ease-in-out",
};

const acceptStyle: CSSProperties = {
  borderColor: "#00e676",
};

const rejectStyle: CSSProperties = {
  borderColor: "#ff1744",
};

interface UploadAvatarProps {
  file?: string;
  onChange: (fileUrl: string) => void;
  loading: boolean;
  size?: number;
  avatarStyle?: CSSProperties;
}

export default function UploadAvatar({
  file,
  onChange,
  loading,
  size = 100,
  avatarStyle = {},
}: UploadAvatarProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileService = FileService(); // Initialize FileService

  const handleDrop = async (acceptedFiles: File[]) => {
    const [uploadedFile] = acceptedFiles;
    if (uploadedFile) {
      const fileUrl = await fileService.uploadFile(uploadedFile); // Upload the file using FileService
      await new Promise(resolve => setTimeout(resolve, 1000))
      setFilePreview(fileUrl); // Set the preview URL to the uploaded file's URL
      onChange(fileUrl); // Notify the parent component of the new file URL
    }
  };

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      accept: { "image/*": [] },
      multiple: false,
      onDrop: handleDrop,
    } as DropzoneOptions);

  const style = useMemo(
    () => ({
      width: size,
      height: size,
      ...baseStyle,
      ...avatarStyle,
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragAccept, isDragReject, size, avatarStyle]
  );

  return (
    <div {...getRootProps({ style })}>
      {loading ? (
        <Loader2 size="small" className="animate-spin" />
      ) : (
        <>
          <input {...getInputProps()} />
          <Image
            style={{ width: "100%", height: "100%", objectFit: "cover", ...avatarStyle }}
            src={filePreview || file || '/placeholder-upload.svg'}
            width={size}
            height={size}
            alt="Avatar"
          />
        </>
      )}
    </div>
  );
}
