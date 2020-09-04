import { RetryPolicy, fetchWithRetry } from "../fetch/fetchWithRetry";

export async function graphFetch(
    token: string,
    graphUrl: string,
    nameForLogging: string,
    logger?: any,
    requestInit?: RequestInit,
    retryPolicy?: any,
    timeoutMs = 0
): Promise<Response> {
    if (!token) {
        throw new Error("Failed to acquire Graph token");
    }

    return graphFetchWithToken(
        token,
        graphUrl,
        nameForLogging,
        logger,
        requestInit,
        retryPolicy,
        timeoutMs
    );
}

export async function graphFetchWithToken(
    token: string,
    graphUrl: string,
    nameForLogging: string,
    logger?: any,
    requestInit?: RequestInit,
    retryPolicy?: RetryPolicy<Response>,
    timeoutMs = 0
): Promise<Response> {
    const url = graphUrl.startsWith("http")
        ? graphUrl
        : `https://graph.microsoft.com/v1.0/${graphUrl}`;

    const authHeader: RequestInit = {
        headers: { Authorization: `Bearer ${token}` },
    };
    const fetchInit: RequestInit = requestInit
        ? { ...requestInit }
        : { ...authHeader };
    if (requestInit) {
        fetchInit.headers = requestInit.headers
            ? { ...requestInit.headers, ...authHeader.headers }
            : { ...authHeader.headers };
    }

    return (
        await fetchWithRetry(
            url,
            fetchInit,
            nameForLogging,
            logger,
            retryPolicy,
            timeoutMs
        )
    ).result;
}
