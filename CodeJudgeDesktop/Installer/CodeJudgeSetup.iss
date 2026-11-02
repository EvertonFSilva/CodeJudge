#define MyAppName "CodeJudge"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Everton (IFF)"
#define MyAppURL "https://github.com/EvertonFSilva/CodeJudge"
#define MyAppExeName "CodeJudge.exe"

[Setup]
AppId={{8B16BEEF-3F2F-4AA1-B3CD-BEF3AC2F3132}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppComments=Projeto particular de TCC do IFF - Desenvolvido por Everton (IFF)
DefaultDirName={autopf}\CodeJudge
DefaultGroupName=CodeJudge
AllowNoIcons=yes
LicenseFile=License.txt
OutputDir=Output
OutputBaseFilename=CodeJudge-v2.0.0-Setup
SetupIconFile=..\Assets\icon.ico
WizardImageFile=..\Assets\WizardImage.bmp
WizardSmallImageFile=..\Assets\WizardSmallImage.bmp
Compression=lzma
SolidCompression=no
WizardStyle=modern
PrivilegesRequired=admin
UninstallDisplayIcon={app}\CodeJudge.exe
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Instalador Oficial do CodeJudge - Everton (IFF)
VersionInfoCopyright=Everton (IFF)
VersionInfoProductName=CodeJudge

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\CodeJudgeApp\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pyc,__pycache__,.pytest_cache,.git*"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\icon.ico"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent
