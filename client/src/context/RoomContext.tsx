import { createContext, useEffect } from "react";
import socketIOClient from 'socket.io-client'
import type {FC, PropsWithChildren} from 'react';
import { useNavigate } from "react-router-dom";

const WS = "http://localhost:8080"

type ReactFC<Props extends Record<PropertyKey, unknown> = {}> = FC<PropsWithChildren<Props>>;

export const RoomContext = createContext<null | any>(null)

const ws = socketIOClient(WS)

export const RoomProvider: ReactFC = ({ children }) => {
    const navigate = useNavigate()
    const enterRoom = ({roomId}: {roomId: 'string'}) => {
        console.log({roomId})
        navigate(`/room/${roomId}`)
    }
    useEffect(() => {
        ws.on('room-created', enterRoom)
    }, [])
    return (
        <RoomContext.Provider value={{ws}}>{children}</RoomContext.Provider>
    )
}