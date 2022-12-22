const express=require('express');

const app =express();

app.use(express.json());

const {open}=require('sqlite');

const sqlite3=require('sqlite3');

const path=require('path');

const dbPath=path.join(__dirname,"cricketMatchDetails.db");

let db=null;

const initializeDbAndServer=async()=>{
    try {
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        });
        app.listen(3000,()=>{
            console.log("Server started at http://localhost:3000");
        });
    } catch (error) {
        console.log(`DB Error ${error.message}`);
    }
};

initializeDbAndServer();

//API 1 Returns a list of all the players in the player table
app.get('/players/',async(request,response)=>{
    const Query=`
        SELECT 
            * 
        FROM 
            player_details`;
    const dbResponseObject=await db.all(Query);

    response.send(dbResponseObject.map((Obj)=>{
        return {
            playerId:Obj.player_id,
            playerName:Obj.player_name
        }
    }))
});

//API 2 Returns a specific player based on the player ID

app.get('/players/:playerId/',async(request,response)=>{
    const {playerId}=request.params;
    const Query=`
        SELECT 
            * 
        FROM 
            player_details
        WHERE player_id=${playerId};`;
    const dbResponseObject=await db.get(Query);

    response.send(
         {
            playerId:dbResponseObject.player_id,
            playerName:dbResponseObject.player_name
        }
    );
});

//API 3 Updates the details of a specific player based on the player ID

app.put('/players/:playerId/',async(request,response)=>{
    const {playerId}=request.params;
    const {playerName}=request.body;
    //console.log(playerId,playerId);
    const Query=`
    UPDATE
        player_details
    SET
        player_name='${playerName}'
    WHERE
        player_id=${playerId};`;
    const dbResponse=await db.run(Query);
    response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match

app.get('/matches/:matchId/',async(request,response)=>{
    const {matchId}=request.params;
    const Query=`
        SELECT 
            match_id AS matchId,
            match,
            year            
        FROM 
            match_details
        WHERE 
            match_id=${matchId};`;
    const dbResponse=await db.get(Query);
    response.send(dbResponse);
});

//API 5 Returns a list of all the matches of a player

app.get('/players/:playerId/matches/',async(request,response)=>{
    const {playerId}=request.params;
    const Query=`
        SELECT 
            *
        FROM 
            match_details
        INNER JOIN 
            player_match_score
        ON 
            player_match_score.match_id=match_details.match_id
        WHERE player_id=${playerId};`;
    const dbObj=await db.all(Query);
    response.send(dbObj.map((Obj)=>{
            return {
                matchId:Obj.match_id,
                match:Obj.match,
                year:Obj.year
            }
    }));
});

//API 6 Returns a list of players of a specific match

app.get('/matches/:matchId/players',async(request,response)=>{
    const {matchId}=request.params;
    const Query=`
        SELECT 
            *
        FROM 
            player_details
        INNER JOIN 
            player_match_score
        ON 
            player_match_score.player_id=player_details.player_id
        WHERE match_id=${matchId};`;
    const dbObj=await db.all(Query);
    response.send(dbObj.map((Obj)=>{
            return {
                playerId:Obj.player_id,
                playerName:Obj.player_name
            }
    }));
});

//API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores',async(request,response)=>{
    const {playerId}=request.params;
    const Query=`
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            sum(player_match_score.score) AS totalScore,
            sum(player_match_score.fours) AS totalFours,
            sum(player_match_score.sixes) AS totalSixes
        FROM 
            player_details
        INNER JOIN 
            player_match_score
        ON 
            player_match_score.player_id=player_details.player_id
        WHERE 
            player_match_score.player_id=${playerId};`;
    const dbObj=await db.all(Query);
    //console.log(...dbObj);
    response.send(...dbObj);
});

module.exports=app;