/**
 * Icon registry for pixelarticons v2.0.2
 *
 * Every name used in the codebase maps to a directly imported pixelarticons/react
 * component. Direct imports (not barrel `import * as Icons`) enable proper tree-shaking.
 *
 * To add an icon: import it below and add it to the iconMap.
 * Check available icons at: https://pixelarticons.com  or node_modules/pixelarticons/react/
 */

import { type ComponentType, type SVGProps } from 'react'

// ── Direct imports from pixelarticons/react ───────────────────────────────────
import { AlarmClock }      from 'pixelarticons/react/AlarmClock'
import { Analytics }       from 'pixelarticons/react/Analytics'
import { Archive }         from 'pixelarticons/react/Archive'
import { ArrowDown }       from 'pixelarticons/react/ArrowDown'
import { ArrowLeft }       from 'pixelarticons/react/ArrowLeft'
import { ArrowRight }      from 'pixelarticons/react/ArrowRight'
import { ArrowsVertical }  from 'pixelarticons/react/ArrowsVertical'
import { ArrowUp }         from 'pixelarticons/react/ArrowUp'
import { Article }         from 'pixelarticons/react/Article'
import { Attachment }      from 'pixelarticons/react/Attachment'
import { Bookmark }        from 'pixelarticons/react/Bookmark'
import { Braces }          from 'pixelarticons/react/Braces'
import { BracesContent }   from 'pixelarticons/react/BracesContent'
import { BracketsAngle }   from 'pixelarticons/react/BracketsAngle'
import { Bulletlist }      from 'pixelarticons/react/Bulletlist'
import { Camera }          from 'pixelarticons/react/Camera'
import { Cancel }          from 'pixelarticons/react/Cancel'
import { Chart }           from 'pixelarticons/react/Chart'
import { Coins }           from 'pixelarticons/react/Coins'
import { ChartBarBig }     from 'pixelarticons/react/ChartBarBig'
import { Check }           from 'pixelarticons/react/Check'
import { CheckboxOn }      from 'pixelarticons/react/CheckboxOn'
import { ChevronDown }     from 'pixelarticons/react/ChevronDown'
import { ChevronLeft }     from 'pixelarticons/react/ChevronLeft'
import { ChevronRight }    from 'pixelarticons/react/ChevronRight'
import { ChevronUp }       from 'pixelarticons/react/ChevronUp'
import { Circle }          from 'pixelarticons/react/Circle'
import { CircuitBoard }    from 'pixelarticons/react/CircuitBoard'
import { Clock }           from 'pixelarticons/react/Clock'
import { Cloud }           from 'pixelarticons/react/Cloud'
import { ColorsSwatch }    from 'pixelarticons/react/ColorsSwatch'
import { CommentText }     from 'pixelarticons/react/CommentText'
import { Copy }            from 'pixelarticons/react/Copy'
import { Cpu }             from 'pixelarticons/react/Cpu'
import { CursorMinimal }   from 'pixelarticons/react/CursorMinimal'
import { Database }        from 'pixelarticons/react/Database'
import { Delete }          from 'pixelarticons/react/Delete'
import { Directions }      from 'pixelarticons/react/Directions'
import { Download }        from 'pixelarticons/react/Download'
import { Expand }          from 'pixelarticons/react/Expand'
import { ExternalLink }    from 'pixelarticons/react/ExternalLink'
import { Eye }             from 'pixelarticons/react/Eye'
import { EyeOff }          from 'pixelarticons/react/EyeOff'
import { File }            from 'pixelarticons/react/File'
import { Files }           from 'pixelarticons/react/Files'
import { FileText }        from 'pixelarticons/react/FileText'
import { Flatten }         from 'pixelarticons/react/Flatten'
import { Folder }          from 'pixelarticons/react/Folder'
import { FolderPlus }      from 'pixelarticons/react/FolderPlus'
import { Frame }           from 'pixelarticons/react/Frame'
import { Globe }           from 'pixelarticons/react/Globe'
import { Grid3x3 }         from 'pixelarticons/react/Grid3x3'
import { Image }           from 'pixelarticons/react/Image'
import { InfoBox }         from 'pixelarticons/react/InfoBox'
import { KeyboardMusic }   from 'pixelarticons/react/KeyboardMusic'
import { Leaf }            from 'pixelarticons/react/Leaf'
import { Link }            from 'pixelarticons/react/Link'
import { Loader }          from 'pixelarticons/react/Loader'
import { Lock }            from 'pixelarticons/react/Lock'
import { MapPin }          from 'pixelarticons/react/MapPin'
import { MoreHorizontal }  from 'pixelarticons/react/MoreHorizontal'
import { MoreVertical }    from 'pixelarticons/react/MoreVertical'
import { Open }            from 'pixelarticons/react/Open'
import { PenSquare }       from 'pixelarticons/react/PenSquare'
import { Play }            from 'pixelarticons/react/Play'
import { Plus }            from 'pixelarticons/react/Plus'
import { Reload }          from 'pixelarticons/react/Reload'
import { Repeat }          from 'pixelarticons/react/Repeat'
import { Robot }           from 'pixelarticons/react/Robot'
import { Search }          from 'pixelarticons/react/Search'
import { Server }          from 'pixelarticons/react/Server'
import { Settings2 }       from 'pixelarticons/react/Settings2'
import { SettingsCog }     from 'pixelarticons/react/SettingsCog'
import { Sparkles }        from 'pixelarticons/react/Sparkles'
import { SquareAlert }     from 'pixelarticons/react/SquareAlert'
import { Terminal }        from 'pixelarticons/react/Terminal'
import { TestTube }        from 'pixelarticons/react/TestTube'
import { Upload }          from 'pixelarticons/react/Upload'
import { User }            from 'pixelarticons/react/User'
import { UserX }           from 'pixelarticons/react/UserX'
import { WarningDiamond }  from 'pixelarticons/react/WarningDiamond'
import { TextColums }      from 'pixelarticons/react/TextColums'
import { Wifi }            from 'pixelarticons/react/Wifi'
import { Zap }             from 'pixelarticons/react/Zap'
import { SpeedMedium }     from 'pixelarticons/react/SpeedMedium'

// ── Type alias ────────────────────────────────────────────────────────────────
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

// ── Icon map — codebase name → imported component ────────────────────────────
const iconMap: Record<string, IconComponent> = {
  // Direct matches
  'arrow-down':       ArrowDown,
  'arrow-left':       ArrowLeft,
  'arrow-right':      ArrowRight,
  'arrow-up':         ArrowUp,
  bookmark:           Bookmark,
  camera:             Camera,
  check:              Check,
  'chevron-down':     ChevronDown,
  'chevron-left':     ChevronLeft,
  'chevron-right':    ChevronRight,
  'chevron-up':       ChevronUp,
  circle:             Circle,
  clock:              Clock,
  cloud:              Cloud,
  coins:              Coins,
  copy:               Copy,
  cpu:                Cpu,
  database:           Database,
  delete:             Delete,
  download:           Download,
  expand:             Expand,
  'external-link':    ExternalLink,
  eye:                Eye,
  file:               File,
  files:              Files,
  'file-text':        FileText,
  folder:             Folder,
  globe:              Globe,
  image:              Image,
  'info-box':         InfoBox,
  leaf:               Leaf,
  link:               Link,
  loader:             Loader,
  lock:               Lock,
  'more-horizontal':  MoreHorizontal,
  'more-vertical':    MoreVertical,
  'pen-square':       PenSquare,
  play:               Play,
  plus:               Plus,
  repeat:             Repeat,
  robot:              Robot,
  search:             Search,
  server:             Server,
  sparkles:           Sparkles,
  'square-alert':     SquareAlert,
  terminal:           Terminal,
  'test-tube':        TestTube,
  upload:             Upload,
  user:               User,
  'user-x':           UserX,
  wifi:               Wifi,
  zap:                Zap,
  gauge:              SpeedMedium,
  'speed-medium':     SpeedMedium,

  // Aliases & mapped equivalents

  // Activity / analytics
  activity:           Analytics,

  // Alert / warning
  'alert-circle':     SquareAlert,
  'alert-triangle':   WarningDiamond,
  'exclamation-triangle': WarningDiamond,
  'triangle-exclamation': WarningDiamond,
  warning:            SquareAlert,

  // Angles → chevrons
  'angle-down':       ChevronDown,
  'angle-left':       ChevronLeft,
  'angle-right':      ChevronRight,
  'angle-up':         ChevronUp,

  // Arrow rotate / reload
  'arrow-rotate-right': Reload,
  'arrows-up-down':   ArrowsVertical,

  // Bolt / lightning
  bolt:               Zap,

  // Brackets / code
  'brackets-curly':   Braces,
  code:               BracketsAngle,
  'code-block':       BracesContent,

  // Browser
  browser:            Globe,

  // Charts
  'chart-bar':        ChartBarBig,
  'chart-line':       Chart,

  // Check variants
  'check-circle':     CheckboxOn,
  'check-list':       Bulletlist,

  // Circle variants
  'circle-notch':     Loader,
  'circle-xmark':     Cancel,

  // Settings / cog
  cog:                Settings2,
  gear:               Settings2,
  'settings-cog':     Settings2,
  'sliders-h':        Settings2,

  // Comments
  'comment-dots':     CommentText,

  // Compress / flatten
  compress:           Flatten,

  // Cursor
  cursor:             CursorMinimal,

  // Edit / pencil / pen
  edit:               PenSquare,
  pen:                PenSquare,
  'pen-nib':          PenSquare,
  pencil:             PenSquare,

  // Ellipsis
  'ellipses-vertical':   MoreVertical,
  'ellipsis-vertical':   MoreVertical,
  'ellipses-horizontal': MoreHorizontal,
  'ellipsis-horizontal': MoreHorizontal,

  // Eye off
  'eye-slash':        EyeOff,

  // File variants
  'file-alt':         FileText,
  'file-archive':     Archive,
  'file-import':      Open,
  'file-lines':       Article,

  // Folder variants
  'folder-open':      FolderPlus,

  // Info
  info:               InfoBox,
  'info-circle':      InfoBox,

  // Key / security
  key:                Lock,

  // Keyboard
  keyboard:           KeyboardMusic,

  // Microchip / hardware
  microchip:          CircuitBoard,

  // Palette / colors
  palette:            ColorsSwatch,

  // Paperclip / attachment
  paperclip:          Attachment,

  // Refresh / reload
  refresh:            Reload,
  'refresh-cw':       Reload,

  // Route / directions
  route:              Directions,

  // Shield
  'shield-check':     SquareAlert,
  'shield-x':         SquareAlert,

  // Spinner
  'spinner-third':    Loader,

  // Stop
  'stop-circle':      Circle,

  // Table / grid
  table:              Grid3x3,
  columns:            TextColums,
  'text-columns':     TextColums,

  // Tag
  tag:                Bookmark,

  // Thumbtack / pin
  thumbtack:          MapPin,

  // Timer
  timer:              AlarmClock,

  // Close / X / times
  times:              Cancel,
  'times-circle':     Cancel,
  x:                  Cancel,
  'x-circle':         Cancel,

  // Trash / delete
  trash:              Delete,
  'trash-alt':        Delete,

  // Vector / shapes
  'vector-square':    Grid3x3,

  // Vial / testing
  vial:               TestTube,

  // Coins (used in some places for currency context)
  coin:               Coins,
}

/**
 * Get the icon component for a given kebab-case name.
 * Returns the React component, or null if not found.
 */
export function getIconComponent(name: string): IconComponent | null {
  return iconMap[name] ?? null
}

/**
 * Get all registered icon names.
 */
export function getRegisteredIcons(): string[] {
  return Object.keys(iconMap)
}

// Legacy name-only lookup (kept for backward compatibility)
export function getIconComponentName(name: string): string | null {
  return iconMap[name] ? name : null
}
