!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Welcome to FlowClone Setup"
  !define MUI_WELCOMEPAGE_TEXT "FlowClone is a system-wide voice dictation tool for Windows, inspired by Wispr Flow.\r\n\r\nThis wizard will guide you through the installation of FlowClone on your computer.\r\n\r\nClick Next to continue."
!macroend

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend
