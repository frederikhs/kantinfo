export interface MenuDate {
    date: string
    is_future: boolean
    is_today: boolean
}

export interface MenuItem {
    group: string
    item: string
}

export interface Navigation {
    previous_date: string|null
    current_date: string
    next_date: string|null
}

export interface CurrentOrNext {
    date: string|null
    is_future: boolean
}
