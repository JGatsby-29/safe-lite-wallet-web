'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import classes from "./Header.module.css";
import Link from "next/link";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem
} from "@nextui-org/navbar";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    "",
    "create-wallet",
    "manage-wallet",
    "send-token",
  ];

  return (
    <Navbar
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="full"
      style={{ backgroundColor: '#1C1C1C'}}
    >

      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
      </NavbarContent>

      <NavbarContent justify='start'>
        <NavbarBrand as={Link} href="/">
          <div style={{ width: 143, height: 29, position: 'relative' }}>
            <img
              src="/kaia_safe_lite.png"
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" style={{ flexGrow: 2, justifyContent: 'center', gap: '4rem' }} >
        <NavbarItem>
          <Link href="/" color="foreground">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/create-wallet" color="foreground">
            Create Wallet
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/manage-wallet" color="foreground">
            Manage Wallet
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/send-token" color="foreground">
            Send Token
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ConnectButton label="Connect"/>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className="w-full"
              color={
                index === 2 ? "warning" : index === menuItems.length - 1 ? "danger" : "foreground"
              }
              href={item}
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>

  );
}