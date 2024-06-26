import React,{ useEffect, useState, useMemo, useCallback } from "react";
import GameOverview from "./Components/GameOverview";
// import PopupComponent from "./Components/PopupComponent";
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
// import CookieConsent from "react-cookie-consent";
import { state_bookmakers, league_titles, team_titles } from "./Resources.js";
import { 
  Collapse,
  Input,
  Navbar,
  Typography,
  IconButton,
  Spinner
} from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

import {americanfootball_nfl_team_props, americanfootball_nfl_scores} from './SampleData/americanfootball_nfl_team_props.js';
import {icehockey_nhl_team_props, icehockey_nhl_scores} from './SampleData/hockey_nhl_team_props.js';
import {baseball_mlb_team_props, baseball_mlb_scores} from './SampleData/baseball_mlb_team_props.js';
import {basketball_nba_team_props, basketball_nba_scores} from './SampleData/basketball_nba_team_props.js';


function App() {
  const numGamesPerPage = 9;
  const [filteredGames, setFilteredGames] = useState([]);
  const [sport, setSport] = useState(window.localStorage.getItem('sport') || 'americanfootball_nfl');
  const [filterText, setFilterText] = useState(window.sessionStorage.getItem('filter_text_' + sport) ? window.sessionStorage.getItem('filter_text_' + sport) : "");
  const [bookies, setBookies] = useState(window.localStorage.getItem('usState')?state_bookmakers[window.localStorage.getItem('usState')]:state_bookmakers["New York"]) ;
  // const [stateName, setStateName] = useState(window.localStorage.getItem('usState') || "All");
  const [openNav, setOpenNav] = useState(false);
  const [pages, setPages] = useState(0);
  const [endIndex, setEndIndex] = useState(numGamesPerPage);
  const [checkedBest, setCheckedBest] = useState(window.sessionStorage.getItem('checkedBest') === 'true' ? true : false);
  // const stateImages = importAll(require.context('./Images/StateIcons/', true, /\.(png|jpe?g|svg)$/));
  const teamImages = importAll(require.context('./Images/TeamImages/', true, /\.(png|jpe?g|svg)$/));
  const sportImages = importAll(require.context('./Images/Sports/', true, /\.(png|jpe?g|svg)$/));

  const filterGames = useCallback(
    ({ target }) => {
      setFilterText(target.value);
      setActive(1);
      window.sessionStorage.setItem('filter_text_' + sport, target.value);
    },
    [sport],
  );
 
  const handleWindowResize = () =>
    window.innerWidth >= 960 && setOpenNav(false);

  const [active, setActive] = useState(parseInt(window.sessionStorage.getItem('page_num')) || 1);

  const next = () => {
    if (active === pages) return;
    setActive(active + 1);
  };
  
  const prev = () => {
    if (active === 1) return;
    setActive(active - 1);
  };
 
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
 
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const fetchData = async () => {
    
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      let odds;
      let scores;
      if(sport === 'americanfootball_nfl'){
        odds = americanfootball_nfl_team_props;
        scores = americanfootball_nfl_scores;
      }else if(sport === 'baseball_mlb') {
        odds = baseball_mlb_team_props;
        scores = baseball_mlb_scores;
      }else if(sport === 'basketball_nba') {
        odds = basketball_nba_team_props;
        scores = basketball_nba_scores;
      }else{
        odds = icehockey_nhl_team_props;
        scores = icehockey_nhl_scores;
      }
      let res = scores.map(x => Object.assign(x, odds.find(y => y.id === x.id)));
      return res;
    } else {
      let today = new Date();
      let nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+8).toISOString().substring(0, 19) + 'Z';
      const url = 'https://fantastic-bunny-92b271.netlify.app/.netlify/functions/game-data-fetch?sport=' + sport + '&commenceTimeTo=' + nextweek;
      const playerData = await fetch(url, {
        method: 'GET'
      });
      if (!playerData.ok) {
        throw new Error(playerData.status, playerData.statusText);
      }
      const odds = await playerData.json();
      return odds;
    }
  };

  const { data: games, status } = useQuery([sport], fetchData,
      {
        staleTime: 7500,
        refetchOnWindowFocus: true,
        retry: 2
      }
  );

  useEffect(() => {
    if(sport !== window.localStorage.getItem('sport')){
      setActive(1);
      filterGames({target: {value: window.sessionStorage.getItem('filter_text_' + sport) || ""}})
    }
    window.localStorage.setItem('sport', sport);
  }, [sport, filterGames]);

    useEffect(() => {
      if(games && !games.error){
        let gamesFiltered = games.filter((game) => game.away_team.toLowerCase().includes(filterText.toLowerCase()) || game.home_team.toLowerCase().includes(filterText.toLowerCase()) || (team_titles[game.away_team] ? team_titles[game.away_team].toLowerCase().includes(filterText.toLowerCase()):false)
        || (team_titles[game.home_team] ? team_titles[game.home_team].toLowerCase().includes(filterText.toLowerCase()):false));
        setFilteredGames(gamesFiltered);
      
        let pageNumber = Math.ceil(gamesFiltered.length / numGamesPerPage);
        setPages(pageNumber);
        if(parseInt(window.sessionStorage.getItem('page_num')) > pageNumber) setActive(1);
      }
    }, [games, filterText]);

    useEffect(() => {
      window.sessionStorage.setItem('page_num', active);
      setEndIndex(active*numGamesPerPage);
    }, [active]);
  
  function stateSelect(values){
    if(!values) {
      setBookies(new Set([]));
      window.localStorage.removeItem('usState');
    }
    else{
      setBookies(state_bookmakers[values]);
      window.localStorage.setItem('usState', values);
    }
    
  }

  function sportChange(sportChoice){
    setOpenNav(false);
    setSport(sportChoice);
  }

  function checkedBestChange(checkedChoice){
    setCheckedBest(checkedChoice);
    window.sessionStorage.setItem('checkedBest', checkedChoice);
  }

  function NavList() {
    let inactive = "flex items-center hover:text-blue-700 grayscale hover:grayscale-0 transition-colors";
    let active = "flex items-center font-bold text-blue-700 transition-colors";
    if (!active){
      stateSelect()
    }
 

    return (
      <ul className="my-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
        <Typography
          as="li"
          variant="small"
          color="blue-gray"
          className="p-1 font-medium"
        >
          {sport === 'basketball_nba' ?<button className={active}>NBA<img className="h-4 w-4 object-cover ml-1" src={sportImages["basketball_nba.png"]} alt={league_titles[sport]} /></button>:
          <button className={inactive} onClick={() => sportChange('basketball_nba')}>NBA
          <img className="h-4 w-4 object-cover ml-1" src={sportImages["basketball_nba.png"]} alt={league_titles[sport]} /></button>}
        </Typography>
        <Typography
          as="li"
          variant="small"
          color="blue-gray"
          className="p-1 font-medium"
        >
          {sport === 'americanfootball_nfl' ?<button className={active}>NFL<img className="h-4 w-4 object-cover ml-1" src={sportImages["americanfootball_nfl.png"]} alt={league_titles[sport]} /></button>:
          <button className={inactive} onClick={() => sportChange('americanfootball_nfl')}>NFL
          <img className="h-4 w-4 object-cover ml-1" src={sportImages["americanfootball_nfl.png"]} alt={league_titles[sport]} /></button>}
        </Typography>
        <Typography
          as="li"
          variant="small"
          color="blue-gray"
          className="p-1 font-medium"
        >
          {sport === 'americanfootball_ncaaf' ?<button className={active}>NCAAF<img className="h-4 w-4 object-cover ml-1" src={sportImages["americanfootball_ncaaf.png"]} alt={league_titles[sport]} /></button>:
          <button className={inactive} onClick={() => sportChange('americanfootball_ncaaf')}>NCAAF
          <img className="h-4 w-4 object-cover ml-1" src={sportImages["americanfootball_nfl.png"]} alt={league_titles[sport]} /></button>}
        </Typography>
        <Typography
          as="li"
          variant="small"
          color="blue-gray"
          className="p-1 font-medium"
        >
          {sport === 'icehockey_nhl' ?<button className={active}>NHL<img className="h-4 w-4 object-cover ml-1" src={sportImages["icehockey_nhl.png"]} alt={league_titles[sport]} /></button>:
          <button className={inactive} onClick={() => sportChange('icehockey_nhl')}>NHL
          <img className="h-4 w-4 object-cover ml-1" src={sportImages["icehockey_nhl.png"]} alt={league_titles[sport]} /></button>}
        </Typography>
        <Typography
          as="li"
          variant="small"
          color="blue-gray"
          className="p-1 font-medium"
        >
          {sport === 'baseball_mlb' ?<button className={active}>MLB<img className="h-4 w-4 object-cover ml-1" src={sportImages["baseball_mlb.png"]} alt={league_titles[sport]} /></button>:
          <button className={inactive} onClick={() => sportChange('baseball_mlb')}>MLB
          <img className="h-4 w-4 object-cover ml-1" src={sportImages["baseball_mlb.png"]} alt={league_titles[sport]} /></button>}
        </Typography>
      </ul>
    );
  }

  // const SelectInHeader = useMemo(() => {
  //   return (
  //     <Select key={stateName} selected={(element) => element && React.cloneElement(element, {className: "flex items-center px-0 gap-2 pointer-events-none",})} 
  //     variant="outlined" label="State" color="white" value={stateName} onChange={(values) => stateSelect(values)} className="z-10" containerProps={{className: "min-w-[60px]",}}>
  //               {Object.keys(state_bookmakers).map((state) => (
  //                 <Option key={state} value={state} className="flex items-center gap-2">
  //                   <img className="h-5 w-5 object-cover" src={stateImages[state + ".png"]} alt={state} />
  //                   {state}
  //                 </Option>
  //               ))}
  //             </Select>
  //   );
  // }, [stateName, stateImages]);

  
  const InputInHeader = useMemo(() => {
    return (
      <div className="relative flex w-full">
        <Input
                  color="white"
                  label="Search"
                  value={filterText}
                  onChange={filterGames}
                  className="pr-20 w-full"
                  containerProps={{
                    className: "min-w-[60px]",
                  }}
                />
        {filterText && (
          <span className="absolute right-0 top-1.5 mr-2">
            <IconButton
            variant="text"
            className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
            onClick={() => (filterGames({target: {value:""}}))}
          >
                <XMarkIcon color="gray" className="h-5 w-5" strokeWidth={4} />
            </IconButton>
          </span>
          )}
      </div>
    );
  }, [filterText, filterGames]);

  return (
    <div className="bodyofitems"> 
      {/* <CookieConsent
      location="bottom"
      buttonText="Got it."
      cookieName="CookieBanner1"
      style={{ background: "#2B373B" }}
      buttonStyle={{ background: "#319DF4", color: "#000000", fontSize: "20px" }}
      expires={150}
    >
      We use cookies to enhance your browsing experience and to deliver targeted advertising on our website. You can learn more about how we use cookies & how to opt out in our <PopupComponent type="privacy" text="text-blue-500 text-sm cursor-pointer"/>{" "}
    </CookieConsent> */}
      <Navbar  className="bodyofitems navBarClass sticky z-10 lg:px-8 lg:py-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="hidden lg:block">
            <NavList>
              <Typography/>
            </NavList>

          </div>
          <div className="hidden lg:block">
              <div>{InputInHeader}</div>
          </div>
          {!openNav ?
          <div className="lg:hidden absolute top-15 right-20 mt-3 text-blue-700 opacity-70">
            <Typography variant="small">
                <span className="flex items-center justify-center font-semibold">{league_titles[sport]}
                <img className="h-4 w-4 object-cover ml-1" src={sportImages[sport + ".png"]} alt={league_titles[sport]} /></span>
            </Typography>
          </div>:<></>}
          <IconButton
            variant="text"
            className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
            ripple={false}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <XMarkIcon className="h-6 w-6" strokeWidth={2} />
            ) : (
             <Bars3Icon className="h-6 w-6" strokeWidth={2} />
            )} 
          </IconButton>
        </div>
        <Collapse open={openNav}>
          <NavList />
        </Collapse>
        <div className="relative flex w-full gap-2 pt-3 
         lg:hidden">
            {InputInHeader}
        </div>
      </Navbar>

      
     

      {status === "loading" || status === "error" ?
        <div className="bodyofitems flex flex-wrap justify-center items-center mt-8 mb-8">
          {status === "loading" ? <Spinner className="h-12 w-12" />:
          status === "error" ? <span className="text-red-500 font-bold text-sm text-center">An unexpected error has occurred. Please try again later</span>:<></> }
        </div> : 
        <div className="bodyofitems">
     
      {filteredGames.length > 0 ?
      <div className="flex items-center justify-center mt-3">
        <label className="relative inline-flex items-center mr-5 cursor-pointer">
            <input type="checkbox" checked={checkedBest} className="sr-only peer" onChange={(value) => checkedBestChange(value.target.checked)}></input>
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-400 dark:peer-focus:ring-blue-700 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-300"></div>
            <span className="lg:hidden ml-3 text-xs font-medium text-blue-gray-500"> Only Show Best Lines</span>    
            <span className="hidden lg:block ml-3 text-sm font-medium text-blue-gray-500"> Only Show Best Lines</span>     
        </label>
        
      </div>
      :<></>}
      

      <div className="mx-auto max-w-screen-xl mb-16 mt-8">
          <div className="flex flex-wrap justify-center items-center mb-16 gap-4">
            {filteredGames.length > 0 ? filteredGames.slice(endIndex-numGamesPerPage,endIndex).map((game) => (
              game.bookmakers?
              <GameOverview
                key={game.id}
                game_id={game.id}
                bookie_list={bookies}
                homeTeam={game.home_team}
                awayTeam={game.away_team}
                bookmakers={bookies.size > 0?game.bookmakers.filter((bk) => bookies.has(bk.key)):game.bookmakers}
                startTime={game.commence_time}
                sport={game.sport_key}
                curScore={game.scores}
                teamImages={teamImages}
                checkedBest={checkedBest}
              />:<></>
            )): <span className="text-gray-500 font-bold drop-shadow-lg text-5xl text-center">No Upcoming Games</span>}
          </div>

          {pages > 1 ? <div className="flex items-center justify-center gap-8">
            <IconButton
              size="sm"
              variant="outlined"
              color="blue-gray"
              onClick={prev}
              disabled={active === 1}
            >
              <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
            <Typography color="gray" className="font-normal mt-3">
              Page <strong className="text-blue-gray-900">{active}</strong> of{" "}
              <strong className="text-blue-gray-900">{pages}</strong>
            </Typography>
            <IconButton
              size="sm"
              variant="outlined"
              color="blue-gray"
              onClick={next}
              disabled={active === pages}
            >
              <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
          </div> : <></>}
      </div></div>}
    
    </div>
  );
}

export function importAll(r) {
  let images = {};
  r.keys().forEach(item => { images[item.replace('./', '')] = r(item); });
  return images;
}

export default App;
