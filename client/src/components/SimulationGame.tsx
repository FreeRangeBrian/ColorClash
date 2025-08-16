import { useState, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { GamePhase, GameColor, BettingState } from '../lib/types';
import { Button } from './ui/button';

export function SimulationGame() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [winner, setWinner] = useState<GameColor | null>(null);
  const [bettingState, setBettingState] = useState<BettingState>({
    bank: 100,
    wager: 0,
    predictedWinner: null
  });

  const handleStartBetting = useCallback(() => {
    setGamePhase('betting');
    setWinner(null);
  }, []);

  const handlePlaceBet = useCallback((wager: number, color: GameColor) => {
    setBettingState(prev => ({
      ...prev,
      wager,
      predictedWinner: color
    }));
    setGamePhase('playing');
  }, []);

  const handleGameEnd = useCallback((winningColor: GameColor) => {
    // Calculate betting results
    const won = bettingState.predictedWinner === winningColor;
    const newBank = won 
      ? bettingState.bank + bettingState.wager // Double the wager (original + wager)
      : bettingState.bank - bettingState.wager;
    
    // Update bank but keep betting info for display
    setBettingState(prev => ({
      ...prev,
      bank: newBank
      // Keep wager and predictedWinner for the results display
    }));
    
    // Check if player is broke
    if (newBank <= 0) {
      setGamePhase('broke');
    } else {
      setGamePhase('ended');
    }
    setWinner(winningColor);
  }, [bettingState]);

  const handleRestart = useCallback(() => {
    // Clear previous betting info when starting new game
    setBettingState(prev => ({
      ...prev,
      wager: 0,
      predictedWinner: null
    }));
    setGamePhase('betting'); // Go directly to betting screen
    setWinner(null);
  }, []);

  const handleQuit = useCallback(() => {
    setBettingState({
      bank: 100,
      wager: 0,
      predictedWinner: null
    });
    setGamePhase('ready');
    setWinner(null);
  }, []);

  const getWinnerText = (color: GameColor) => {
    const colorNames: Record<GameColor, string> = {
      blue: 'Blue',
      red: 'Red',
      green: 'Green'
    };
    return colorNames[color];
  };

  const getRandomWinMessage = () => {
    const winMessages = [
      "You're a genius for picking the winner!",
      "Brilliant choice! You saw that coming!",
      "What a mastermind! Perfect prediction!",
      "You're absolutely brilliant!",
      "Outstanding pick! You're on fire!",
      "Incredible instincts! You nailed it!",
      "Pure genius! You called it perfectly!",
      "Amazing foresight! You're unstoppable!"
    ];
    return winMessages[Math.floor(Math.random() * winMessages.length)];
  };

  const getRandomLossMessage = () => {
    const lossMessages = [
      "You're such a loser!",
      "You're pathetic!",
      "What a terrible bet! You stink!",
      "Epic fail! Try harder next time!",
      "That was embarrassing! So bad!",
      "Awful choice! You're hopeless!",
      "Terrible instincts! What were you thinking?",
      "You're the worst bettor ever!",
      "That was painful to watch!",
      "Complete disaster! You're awful!"
    ];
    return lossMessages[Math.floor(Math.random() * lossMessages.length)];
  };

  const BettingInterface = () => {
    const [selectedColor, setSelectedColor] = useState<GameColor | null>(null);
    const [wagerAmount, setWagerAmount] = useState<number>(10);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleBetSubmit = () => {
      setErrorMessage('');
      
      if (!selectedColor) {
        setErrorMessage('Please select a color first.');
        return;
      }
      
      if (wagerAmount <= 0) {
        setErrorMessage('Wager amount must be greater than 0.');
        return;
      }
      
      if (wagerAmount > bettingState.bank) {
        setErrorMessage('You cannot bet more than your bank balance.');
        return;
      }
      
      handlePlaceBet(wagerAmount, selectedColor);
    };

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 30
        }}
      >
        <div 
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '90%'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            Place Your Bet
          </h2>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Bank: <strong>{bettingState.bank} credits</strong>
          </p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Choose a color:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {(['blue', 'red', 'green'] as GameColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: color === 'blue' ? '#3b82f6' : color === 'red' ? '#ef4444' : '#22c55e',
                    border: selectedColor === color ? '4px solid #000' : '2px solid #ccc',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Wager Amount:
            </label>
            <input
              type="number"
              min="1"
              max={bettingState.bank}
              value={wagerAmount}
              onChange={(e) => setWagerAmount(Math.min(bettingState.bank, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{
                width: '100px',
                padding: '0.5rem',
                border: '2px solid #ccc',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '1rem'
              }}
            />
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Win: {wagerAmount * 2} credits | Lose: -{wagerAmount} credits
            </p>
          </div>

          {errorMessage && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '0.375rem', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button 
              onClick={handleBetSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              Place Bet
            </Button>
            <Button 
              onClick={() => setGamePhase('ready')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Title bar - fixed at top */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '60px',
          backgroundColor: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h1 
          style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: 0
          }}
        >
          Square Battle Simulation
        </h1>
        
        {/* Bank display in title bar */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>Bank</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>
            {bettingState.bank} credits
          </div>
        </div>
      </div>

      <GameCanvas 
        gamePhase={gamePhase}
        onGameEnd={handleGameEnd}
      />
      
      {/* Game rules bar - fixed at bottom */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#374151',
          color: '#ffffff',
          padding: '15px 20px',
          zIndex: 10,
          textAlign: 'center',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ fontSize: '0.875rem', marginBottom: '5px', fontWeight: 'bold' }}>
          Battle Rules:
        </div>
        <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span>Blue beats Red</span>
          <span>Green beats Blue</span>
          <span>Red beats Green</span>
          <span>Winners split into 2 squares</span>
          <span>Same colors pass through!</span>
        </div>
      </div>
      
      {gamePhase === 'ready' && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}
        >
          <Button 
            onClick={handleStartBetting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
          >
            Place Bet & Play
          </Button>
        </div>
      )}
      
      {gamePhase === 'betting' && <BettingInterface />}
      
      {gamePhase === 'ended' && winner && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 20
          }}
        >
          <div 
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#1f2937'
              }}
            >
              🏆 {getWinnerText(winner)} Wins! 🏆
            </h2>
            
            {bettingState.predictedWinner && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '1.5rem', 
                backgroundColor: winner === bettingState.predictedWinner ? '#dcfce7' : '#fee2e2', 
                borderRadius: '0.5rem',
                border: `2px solid ${winner === bettingState.predictedWinner ? '#22c55e' : '#ef4444'}`
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>
                  You bet <strong>{bettingState.wager} credits</strong> on <strong>{getWinnerText(bettingState.predictedWinner)}</strong>
                </p>
                
                {winner === bettingState.predictedWinner ? (
                  <div>
                    <p style={{ 
                      margin: '0.5rem 0', 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold',
                      color: '#22c55e'
                    }}>
                      🎉 {getRandomWinMessage()} 🎉
                    </p>
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      fontSize: '1.1rem', 
                      color: '#16a34a',
                      fontWeight: '600'
                    }}>
                      You won {bettingState.wager} credits! Added to your bank!
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ 
                      margin: '0.5rem 0', 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold',
                      color: '#ef4444'
                    }}>
                      😤 {getRandomLossMessage()} 😤
                    </p>
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      fontSize: '1.1rem', 
                      color: '#dc2626',
                      fontWeight: '600'
                    }}>
                      You lost {bettingState.wager} credits! Pay up!
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button 
                onClick={handleRestart}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-semibold"
              >
                Play Again
              </Button>
              <Button 
                onClick={handleQuit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 text-lg font-semibold"
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}

      {gamePhase === 'broke' && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 20
          }}
        >
          <div 
            style={{
              background: '#fee2e2',
              padding: '3rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '3px solid #dc2626',
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h2 
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#dc2626'
              }}
            >
              💸 GAME OVER 💸
            </h2>
            
            <p style={{
              fontSize: '1.25rem',
              color: '#991b1b',
              fontWeight: 'bold',
              marginBottom: '1rem',
              lineHeight: '1.5'
            }}>
              You have lost all your money.<br/>
              You're a broke loser.<br/>
              We don't play with losers.<br/>
              Go Home.
            </p>
            
            <Button 
              onClick={handleQuit}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold"
            >
              Leave in Shame
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
