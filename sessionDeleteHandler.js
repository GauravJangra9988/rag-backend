
export const sessionDeleteHandler = (req, res) =>{
    res.cookie("sessionId", "");
    res.status(200).json({message: "session removed and all documents data cleared"})
}