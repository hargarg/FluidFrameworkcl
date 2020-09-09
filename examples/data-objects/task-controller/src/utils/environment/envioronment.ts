export const isWebClient = () => {
    return typeof window !== "undefined" && typeof window.document !== "undefined";
}