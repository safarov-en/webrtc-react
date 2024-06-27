import { createContext } from "react";
import socketIOClient from 'socket.io-client'
import type {FC, PropsWithChildren} from 'react';

const WS = "http://localhost:8080"

type ReactFC<Props extends Record<PropertyKey, unknown> = {}> = FC<PropsWithChildren<Props>>;

export const RoomContext = createContext<null | any>(null)

const ws = socketIOClient(WS)

export const RoomProvider: ReactFC = ({ children }) => {
    return (
        <RoomContext.Provider value={{ws}}>{children}</RoomContext.Provider>
    )
}