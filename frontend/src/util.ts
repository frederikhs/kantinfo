import Environment from "./env.ts";
import type {CurrentOrNext, MenuDate, MenuItem, Navigation} from "./type.ts";

export interface Response {
    exception?: unknown
    response: unknown
    status: number
}

const getJson = async (uri: string) => {
    const response = await fetch(uri, {
        method: 'GET'
    })

    let responseJson

    try {
        responseJson = await response.json();
    } catch (exception) {
        responseJson = {
            exception: exception,
            status: response.status,
            response: {}
        };
    }

    return {
        status: response.status,
        response: responseJson,
    };
}

interface DatesResponse extends Response {
    response: MenuDate[]
}

export async function getDates(): Promise<DatesResponse> {
  return await getJson(`${Environment.REST_API_HOST}/dates`);
}

interface MenuResponse extends Response {
    response: {
        menu: MenuItem[],
        navigation: Navigation,
        current_or_next: CurrentOrNext,
    }
}

export async function getMenuItems(date: string): Promise<MenuResponse> {
  return await getJson(`${Environment.REST_API_HOST}/menu/${date}`);
}
