import { useEffect, useState } from 'react';

export function DevToolsDetector() {
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    useEffect(() => {
        // Basic detection strategies
        // 1. Check window dimensions difference (devtools usually takes space)
        // 2. Debugger trap

        const checkDevTools = () => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if ((widthThreshold || heightThreshold) && import.meta.env.PROD) {
                setIsDevToolsOpen(true);
            }
        };

        window.addEventListener('resize', checkDevTools);

        // Debugger trap for console opening
        const interval = setInterval(() => {
            if (import.meta.env.PROD) {
                const start = Date.now();
                debugger; // This will pause execution if devtools is open
                if (Date.now() - start > 100) {
                    setIsDevToolsOpen(true);
                }
            }
        }, 1000);

        return () => {
            window.removeEventListener('resize', checkDevTools);
            clearInterval(interval);
        };
    }, []);

    if (isDevToolsOpen) {
        return (
            <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-md">
                    <h1 className="text-4xl font-bold text-destructive">SECURITY ALERT</h1>
                    <p className="text-xl">Developer Tools Detected.</p>
                    <p className="text-muted-foreground">
                        For security reasons, the application interface has been frozen.
                        Please close developer tools and refresh the page to continue.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
