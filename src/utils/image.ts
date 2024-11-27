import { invoke } from "@tauri-apps/api/core";
import { EmojiImage } from "../types.ts";

const convertWebp2Gif = async (inputFile: string, outputFile: string) => {
    await invoke('convert_webp2gif', { inputFile, outputFile })
}

const formatToUrl = (format: string, emoji: EmojiImage): string => {
    switch (format) {
        case 'webp':
            return emoji.image_webp ?? emoji.image
        case 'gif':
            return emoji.image_gif ?? emoji.image
        case 'png':
            return emoji.image
        default:
            return emoji.image_gif ?? emoji.image_webp ?? emoji.image
    }
}

export { formatToUrl, convertWebp2Gif }