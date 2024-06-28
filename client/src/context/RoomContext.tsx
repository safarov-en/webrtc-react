import { createContext, useEffect, useState } from "react";
import socketIOClient from 'socket.io-client'
import type {FC, PropsWithChildren} from 'react';
import { useNavigate } from "react-router-dom";
import {v4 as uuidV4} from 'uuid'
import Peer from "peerjs";

const WS = "http://localhost:8080"

type ReactFC<Props extends Record<PropertyKey, unknown> = {}> = FC<PropsWithChildren<Props>>;

export const RoomContext = createContext<null | any>(null)

const ws = socketIOClient(WS)

export const RoomProvider: ReactFC = ({ children }) => {
    const navigate = useNavigate()
    const [me, setMe] = useState<Peer>()
    const [stream, setStream] = useState<MediaStream>()
    const enterRoom = ({roomId}: {roomId: 'string'}) => {
        console.log({roomId})
        navigate(`/room/${roomId}`)
    }
    const getUsers = ({participants}: {participants: string[]}) => {
        console.log({participants})
    }
    useEffect(() => {
        const meId = uuidV4()
        const peer = new Peer(meId)
        setMe(peer)
        try {
            navigator.mediaDevices
                .getUserMedia({video: true, audio: true})
                .then((stream) => {
                    setStream(stream)
                })
        } catch(error) {
            console.log(error)
        }
        ws.on('room-created', enterRoom)
        ws.on('get-users', getUsers)
    }, [])
    return (
        <RoomContext.Provider value={{ws, me, stream}}>{children}</RoomContext.Provider>
    )
}