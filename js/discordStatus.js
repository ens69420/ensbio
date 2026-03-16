document.addEventListener('DOMContentLoaded', () => {
    const discordInfoRoot = document.querySelector('.discordInfos');
    const discordUserId = discordInfoRoot?.dataset.discordId;

    const mainAvatarElement = document.querySelector('.avatar');
    const avatarElement = document.querySelector('.avatarImage');
    const statusElement = document.querySelector('.discordStatus');
    const usernameElement = document.querySelector('.discordUsername');
    const displayNameElement = document.querySelector('.discordDisplayName');
    const badgesContainer = document.querySelector('.discordUserBadges');
    const activityTitleElement = document.querySelector('.discordActivityTitle');
    const activityDetailsElement = document.querySelector('.discordActivityDetails');
    const activityStateElement = document.querySelector('.discordActivityState');
    const activityImageElement = document.querySelector('.discordActivityImage');

    const statusIcons = {
        online: './img/online.png',
        idle: './img/idle.png',
        dnd: './img/dnd.png',
        offline: './img/offline.png'
    };

    let websocket;
    let heartbeatTimer;
    let reconnectTimer;
    let pollingTimer;

    const badgeDefinitions = [
        {
            flag: 1,
            label: 'Discord Staff',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png'
        },
        {
            flag: 2,
            label: 'Partnered Server Owner',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png'
        },
        {
            flag: 4,
            label: 'HypeSquad Events',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png'
        },
        {
            flag: 8,
            label: 'Bug Hunter Level 1',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png'
        },
        {
            flag: 64,
            label: 'HypeSquad Bravery',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png'
        },
        {
            flag: 128,
            label: 'HypeSquad Brilliance',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png'
        },
        {
            flag: 256,
            label: 'HypeSquad Balance',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png'
        },
        {
            flag: 512,
            label: 'Early Supporter',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png'
        },
        {
            flag: 16384,
            label: 'Bug Hunter Level 2',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png'
        },
        {
            flag: 262144,
            label: 'Certified Moderator',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png'
        },
        {
            flag: 4194304,
            label: 'Active Developer',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png'
        }
    ];

    const nitroBadgeDefinitions = {
        nitro: {
            label: 'Discord Nitro',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png'
        },
        nitroBasic: {
            label: 'Discord Nitro Basic',
            iconUrl: 'https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png'
        }
    };

    function buildAvatarUrl() {
        return `https://api.lanyard.rest/${discordUserId}.png?cache=${Date.now()}`;
    }

    function updateAvatar() {
        if (!discordUserId) {
            return;
        }

        const avatarUrl = buildAvatarUrl();

        if (avatarElement) {
            avatarElement.src = avatarUrl;
        }

        if (mainAvatarElement) {
            mainAvatarElement.src = avatarUrl;
        }
    }

    function renderBadges(discordUser) {
        if (!badgesContainer) {
            return;
        }

        badgesContainer.innerHTML = '';

        const userFlags = Number(discordUser?.public_flags || 0);
        const premiumType = Number(discordUser?.premium_type || 0);
        const hasNitroInference =
            premiumType > 0 ||
            Boolean(discordUser?.avatar?.startsWith('a_')) ||
            Boolean(discordUser?.avatar_decoration_data) ||
            Boolean(discordUser?.collectibles?.nameplate);

        const resolvedBadges = badgeDefinitions
            .filter((badge) => (userFlags & badge.flag) === badge.flag)
            .map((badge) => ({
                label: badge.label,
                iconUrl: badge.iconUrl
            }));

        if (hasNitroInference) {
            if (premiumType === 3) {
                resolvedBadges.push(nitroBadgeDefinitions.nitroBasic);
            } else {
                resolvedBadges.push(nitroBadgeDefinitions.nitro);
            }
        }

        resolvedBadges.forEach((badge) => {
                const badgeElement = document.createElement('div');
                const badgeIcon = document.createElement('img');

                badgeElement.className = 'discordUserBadge discordFlagBadge';
                badgeElement.dataset.tooltip = badge.label;
                badgeIcon.className = 'discordFlagBadgeIcon';
                badgeIcon.src = badge.iconUrl;
                badgeIcon.alt = badge.label;
                badgeIcon.loading = 'lazy';

                badgeElement.appendChild(badgeIcon);
                badgesContainer.appendChild(badgeElement);
            });
    }

    function updateStatus(status) {
        if (!statusElement) {
            return;
        }

        const normalizedStatus = statusIcons[status] ? status : 'offline';
        statusElement.src = statusIcons[normalizedStatus];
        statusElement.alt = normalizedStatus;
    }

    function updateNames(discordUser) {
        if (!discordUser) {
            return;
        }

        const displayName = discordUser.display_name || discordUser.global_name || discordUser.username || '';
        const username = discordUser.username || displayName;

        if (displayNameElement && displayName) {
            displayNameElement.textContent = displayName;
        }

        if (usernameElement && username) {
            usernameElement.textContent = username;
        }
    }

    function buildActivityAssetUrl(activity) {
        const largeImage = activity?.assets?.large_image;

        if (!largeImage) {
            return '';
        }

        if (largeImage.startsWith('spotify:')) {
            return `https://i.scdn.co/image/${largeImage.replace('spotify:', '')}`;
        }

        if (largeImage.startsWith('mp:external/')) {
            return `https://media.discordapp.net/${largeImage.replace('mp:', '')}`;
        }

        if (activity.application_id) {
            return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImage}.png`;
        }

        return '';
    }

    function pickActivity(presenceData) {
        const activities = Array.isArray(presenceData?.activities) ? presenceData.activities : [];
        const richPresence = activities.find((activity) => ![1, 4].includes(activity.type));

        if (richPresence) {
            return richPresence;
        }

        if (presenceData?.listening_to_spotify && presenceData.spotify) {
            return {
                name: 'Spotify',
                details: presenceData.spotify.song,
                state: presenceData.spotify.artist,
                assets: {
                    large_image: `spotify:${presenceData.spotify.album_art_url.split('/').pop()}`
                }
            };
        }

        return null;
    }

    function updateActivity(presenceData) {
        if (!activityTitleElement || !activityDetailsElement || !activityStateElement) {
            return;
        }

        const activity = pickActivity(presenceData);

        if (!activity) {
            activityTitleElement.textContent = 'No active RPC';
            activityDetailsElement.textContent = '';
            activityStateElement.textContent = '';

            if (activityImageElement) {
                activityImageElement.hidden = true;
                activityImageElement.removeAttribute('src');
            }
            return;
        }

        activityTitleElement.textContent = activity.name || 'Discord Activity';
        activityDetailsElement.textContent = activity.details || activity.state || '';
        activityStateElement.textContent = activity.details && activity.state ? activity.state : '';

        if (!activityDetailsElement.textContent && activity.state) {
            activityDetailsElement.textContent = activity.state;
        }

        const assetUrl = buildActivityAssetUrl(activity);
        if (activityImageElement) {
            if (assetUrl) {
                activityImageElement.src = assetUrl;
                activityImageElement.hidden = false;
            } else {
                activityImageElement.hidden = true;
                activityImageElement.removeAttribute('src');
            }
        }
    }

    function applyPresenceData(presenceData) {
        if (!presenceData) {
            updateStatus('offline');
            renderBadges(null);
            updateActivity(null);
            return;
        }

        updateAvatar();
        updateStatus(presenceData.discord_status || 'offline');
        updateNames(presenceData.discord_user);
        renderBadges(presenceData.discord_user);
        updateActivity(presenceData);
    }

    async function fetchPresence() {
        if (!discordUserId) {
            return;
        }

        try {
            const response = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`);
            const payload = await response.json();

            if (payload.success && payload.data) {
                applyPresenceData(payload.data);
            } else {
                applyPresenceData(null);
            }
        } catch (error) {
            console.error('Lanyard REST request failed:', error);
            applyPresenceData(null);
        }
    }

    function stopPolling() {
        if (!pollingTimer) {
            return;
        }

        window.clearInterval(pollingTimer);
        pollingTimer = undefined;
    }

    function startPolling() {
        if (pollingTimer) {
            return;
        }

        fetchPresence();
        pollingTimer = window.setInterval(fetchPresence, 30000);
    }

    function stopHeartbeat() {
        if (!heartbeatTimer) {
            return;
        }

        window.clearInterval(heartbeatTimer);
        heartbeatTimer = undefined;
    }

    function startHeartbeat(interval) {
        stopHeartbeat();

        heartbeatTimer = window.setInterval(() => {
            if (websocket?.readyState === WebSocket.OPEN) {
                websocket.send(JSON.stringify({ op: 3 }));
            }
        }, interval);
    }

    function scheduleReconnect() {
        if (reconnectTimer) {
            return;
        }

        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = undefined;
            connectPresenceSocket();
        }, 5000);
    }

    function connectPresenceSocket() {
        if (!discordUserId || typeof WebSocket === 'undefined') {
            startPolling();
            return;
        }

        websocket = new WebSocket('wss://api.lanyard.rest/socket');

        websocket.addEventListener('open', () => {
            stopPolling();
        });

        websocket.addEventListener('message', (event) => {
            const payload = JSON.parse(event.data);

            if (payload.op === 1) {
                startHeartbeat(payload.d.heartbeat_interval);
                websocket.send(JSON.stringify({
                    op: 2,
                    d: {
                        subscribe_to_id: discordUserId
                    }
                }));
                return;
            }

            if (payload.op !== 0) {
                return;
            }

            if (payload.t === 'INIT_STATE' || payload.t === 'PRESENCE_UPDATE') {
                applyPresenceData(payload.d);
            }
        });

        websocket.addEventListener('close', () => {
            stopHeartbeat();
            startPolling();
            scheduleReconnect();
        });

        websocket.addEventListener('error', () => {
            websocket?.close();
        });
    }

    if (!discordUserId) {
        return;
    }

    renderBadges(null);
    updateAvatar();
    fetchPresence();
    connectPresenceSocket();
});
