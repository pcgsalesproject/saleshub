import { ReactNode } from "react";

declare global {
  type PageProps<T = string> = {
    params: Promise<{ [key: string]: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  };
}
