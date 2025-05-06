import { ref } from "vue";
import { toast } from "vue-sonner";

export const useFile = (acceptExt?: string[], errorMessage?: string) => {
  const singleFile = ref<File>();

  const changeHandler = (event: Event) => {
    const element = event.currentTarget as HTMLInputElement;

    const file = element?.files?.item(0);
    if (
      acceptExt &&
      !acceptExt?.some((ext) =>
        file?.name.toLowerCase().endsWith(ext.toLowerCase())
      )
    ) {
      toast.error(errorMessage ?? "이미지 파일을 업로드 해 주세요.");
      element.files = null;
      element.value = "";
      singleFile.value = undefined;

      return;
    }

    if (file) {
      singleFile.value = file;
    }
  };

  return {
    file: singleFile,
    changeHandler,
  };
};
