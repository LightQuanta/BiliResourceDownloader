import {invoke} from "@tauri-apps/api/core";
import {EmojiImages} from "../types.ts";

const convertWebp2Gif = async (inputFile: string, outputFile: string) => {
    await invoke('convert_webp2gif', {inputFile, outputFile})
}

const formatToUrl = (format: string, emoji:EmojiImages):string => {
    switch (format) {
        case 'wenp':
            return emoji.image_webp ?? emoji.image_gif ?? emoji.image
        case 'gif':
            return emoji.image_gif  ?? emoji.image
        case 'png':
            return emoji.image
        default:
            return emoji.image_webp ?? emoji.image_gif ?? emoji.image
    }
}

export { formatToUrl, convertWebp2Gif }