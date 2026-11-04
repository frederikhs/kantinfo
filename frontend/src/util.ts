import Environment from "./env.ts";
import type {CurrentOrNext, MenuDate, MenuGroup, Navigation} from "./type.ts";

export interface Response {
    exception?: unknown
    response: unknown
    status: number
}

const getJson = async (uri: string, signal?: AbortSignal) => {
    const response = await fetch(uri, {
        method: 'GET',
        signal
    })

    const responseJson = await response.json()

    return {
        status: response.status,
        response: responseJson,
    };
}

interface DatesResponse extends Response {
    response: MenuDate[]
}

export async function getDates(signal?: AbortSignal): Promise<DatesResponse> {
  return await getJson(`${Environment.REST_API_HOST}/dates`, signal);
}

interface MenuResponse extends Response {
    response: {
        menu: MenuGroup[],
        navigation: Navigation,
        current_or_next: CurrentOrNext,
    }
}

export async function getMenuItems(date: string, signal?: AbortSignal): Promise<MenuResponse> {
  return await getJson(`${Environment.REST_API_HOST}/menu/${date}`, signal);
}
