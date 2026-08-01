// import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router";
import Frame from "./Frame.tsx";
import DatePage from "./pages/DatePage.tsx";
import MenuPage from "./pages/MenuPage.tsx";

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <BrowserRouter>
        <Routes>
            <Route element={<Frame/>}>
                <Route index element={<MenuPage/>}/>
                <Route path={"datoer"} element={<DatePage/>}/>
                <Route path="menu/:date" element={<MenuPage/>}/>
            </Route>
        </Routes>
    </BrowserRouter>
    // </StrictMode>
)
