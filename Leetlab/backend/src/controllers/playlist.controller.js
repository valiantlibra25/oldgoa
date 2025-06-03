import { db } from "../libs/db.js"

export const getAllListDetails = async (req,res)=>{
    try {
        const playlists = await db.playlist.findMany({
            where:{
                userId:req.user.id
            },
            include:{
                problems:{
                    include:{
                        problem:true
                    }
                }
            }
        })

        res.status(200).json({
            success:true,
            message:"playlist fetched successfully",
            playlists
        })
    } catch (error) {
        console.error("Error fetching playlist",error)
        res.status(500).json({error:'Failed to fetch playlist'})
    }
}

export const getPlayListDetails = async (req,res)=>{
    const {playlistId} = req.params
    try {
        const playlists = await db.playlist.findUnique({
            where:{
                id:playlistId,
                userId:req.user.id
            },
            include:{
                problems:{
                    include:{
                        problem:true
                    }
                }
            }
        })

        if(!playlists){
            return res.status(404).json({error:"playlist not found"})
        }

        res.status(200).json({
            success:true,
            message:"playlist fetched successfully",
            playlists
        })
    } catch (error) {
        console.error("Error creating playlist",error)
        res.status(500).json({error:'Failed to created playlist'})
    }
}

export const createPlaylist = async (req,res)=>{
    try {
        const {name, description} = req.body
        const userId = req.user.userId

        const playlist = await db.playlist.create({
            name,
            description,
            userId
        })

        res.status(200).json({
            success:true,
            message:"Playlist created successfully",
            playlist
        })
    } catch (error) {
        console.error("Error creating playlist",error)
        res.status(500).json({error:'Failed to created playlist'})
    }
}

export const addProblemToPlaylist = async (req,res)=>{
    const {playlistId} = req.params
    const {problemIds} = req.body

    try {
        if(!Array.isArray(problemIds) || problemIds.length === 0){
            return res.status(400).json({error:"Invalid or missing problemsId"})
        }

        // create records for each problem in the playlist

        const problemInPlaylist = await db.problemInPlaylist.createMany({
            data:problemIds.map((problemId)=>({
                playlistId,
                problemId
            }))
        })

        res.status(201).json({
            success:true,
            message:"problems added in playlist",
            problemInPlaylist
        })
    } catch (error) {
        console.error("Error adding problem in playlist",error)
        res.status(500).json({error:'Failed to add problem in  playlist'})
    }
}

export const deletePlaylist = async (req,res)=>{
    const {playlistId} = req.params
    try {
        const deletedPlaylist = await db.playlist.delete({
            id:playlistId
        })

        res.status(201).json({
            success:true,
            message:"playlist deleted successfully",
            deletedPlaylist
        })
    } catch (error) {
         console.error("Error deleting playlist",error)
        res.status(500).json({error:'Failed to delete playlist'})
    }
}

export const removeProblemFromPlaylist = async (req,res)=>{
    const {playlistId} = req.params
    const {problemIds} = req.body

    try {
        if(!Array.isArray(problemIds) || problemIds.length === 0){
            return res.status(400).json({error:"Invalid or missing problemsId"})
        }

        const deletedProblem = await db.problemInPlaylist.deleteMany({
            where:{
                playlistId,
                problemId:{
                    in:problemIds
                }
            }
        })

        res.status(201).json({
            success:true,
            message:"problem removed successfully",
            deletedProblem
        })
    } catch (error) {
         console.error("Error removing problems",error)
        res.status(500).json({error:'Failed to remove problems'})
    }
}