import { StateManager } from '../core/state-manager';
import { FloatingMenu } from '../ui/floating-menu';
import { PlayerButton } from '../ui/player-button';
import { TimelineMarkers } from '../ui/timeline-markers';

function initTrackMark() {
  const stateManager = new StateManager();
  const floatingMenu = new FloatingMenu(stateManager);
  const playerButton = new PlayerButton(floatingMenu);
  const timelineMarkers = new TimelineMarkers(stateManager);

  (window as unknown as { __trackmark: unknown }).__trackmark = {
    stateManager,
    floatingMenu,
    playerButton,
    timelineMarkers,
    videoController: stateManager.videoController,
    spaNavigator: stateManager.spaNavigator
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTrackMark);
} else {
  initTrackMark();
}
