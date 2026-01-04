export async function fetchVideoTitle(videoId){
    try{
        const res = await fetch(`/api/title?id=${videoId}`);
        const data = await res.json();
        if(!res.ok)return null;
        return data.title||null;
    } 
    catch{
        return null;
    }
}