import { createContext, useEffect, useState, useReducer } from "react";
import socketIOClient from 'socket.io-client'
import type {FC, PropsWithChildren} from 'react';
import { useNavigate } from "react-router-dom";
import {v4 as uuidV4} from 'uuid'
import Peer from "peerjs";
import { peersReducer } from "./peerReducer";
import { addPeerAction, removePeerAction } from "./peerActions";

const WS = "http://localhost:8080"

type ReactFC<Props extends Record<PropertyKey, unknown> = {}> = FC<PropsWithChildren<Props>>;

export const RoomContext = createContext<null | any>(null)

const ws = socketIOClient(WS)

export const RoomProvider: ReactFC = ({ children }) => {
    const navigate = useNavigate()
    const [me, setMe] = useState<Peer>()
    const [stream, setStream] = useState<MediaStream>()
    const [peers, dispatch] = useReducer(peersReducer, {})
    const [screenSharingId, setScreenSharingId] = useState<string>("")
    const [roomId, setRoomId] = useState<string>()
    const enterRoom = ({roomId}: {roomId: 'string'}) => {
        console.log({roomId})
        navigate(`/room/${roomId}`)
    }
    const getUsers = ({participants}: {participants: string[]}) => {
        console.log({participants})
    }
    const removePeer = (peerId: string) => {
        dispatch(removePeerAction(peerId))
    }
    const switchStream = (stream: MediaStream) => {
        setStream(stream)
        setScreenSharingId(me?.id || '')
        Object.values(me?.connections).forEach((connection: any) => {
            const videoTrack = stream
                ?.getTracks()
                .find((track) => track.kind === 'video')
            connection[0].peerConnection
                .getSenders()[1]
                .replaceTrack(videoTrack)
                .catch((err: any) => console.log(err))
        })
    }
    const shareScreen = () => {
        if(screenSharingId) {
            navigator.mediaDevices
                .getUserMedia({video: true, audio: true})
                .then(switchStream)
        } else {
            navigator.mediaDevices.getDisplayMedia({}).then(switchStream)
        }
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
        ws.on('user-disconnected', removePeer)
        ws.on('user-started-sharing', (peerId) => setScreenSharingId(peerId))
        ws.on('user-stoped-sharing', () => setScreenSharingId(""))
        return () => {
            ws.off('room-created')
            ws.off('get-users')
            ws.off('user-disconnected')
            ws.off('user-shared-screen')
            ws.off('user-stoped-sharing')
            ws.off('user-joined')
        }
    }, [])
    useEffect(() => {
        if(screenSharingId) {
            ws.emit('start-sharing', {peerId: screenSharingId, roomId})
        } else {
            ws.emit('stop-sharing')
        }
    }, [screenSharingId, roomId])
    useEffect(() => {
        if(!me) return
        if(!stream) return
        ws.on('user-joined', ({peerId}) => {
            const call = me.call(peerId, stream)
            call.on('stream', (peerStream) => {
                dispatch(addPeerAction(peerId, peerStream))
            })
        })
        me.on('call', (call) => {
            call.answer(stream)
            call.on('stream', (peerStream) => {
                dispatch(addPeerAction(call.peer, peerStream))
            })
        })
    }, [me, stream])
    return (
        <RoomContext.Provider value={{ws, me, stream, peers, shareScreen, screenSharingId, setRoomId}}>{children}</RoomContext.Provider>
    )
}