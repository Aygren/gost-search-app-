{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.pnpm
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
} 