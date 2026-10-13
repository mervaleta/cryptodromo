import React from "react";
import { Box, Flex, Text, Image } from "@chakra-ui/react";
import Link from "next/link";

export default function Footer() {
  const linkHover = { color: "#60efff" };

  return (
    <Box height="280px" px="50px" py="45px">
      <Flex
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        h="full"
      >
        <Flex
          justifyContent="space-between"
          textAlign={"right"}
          paddingLeft={"2"}
          w="76%"
          h="full"
        >
          {/* Column 1: About Us */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/aboutus">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  About us
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/history">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  History
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/howItWorks">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  How it works
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/mission">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Mission
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/vision">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Vision
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/ourteam">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Our Team
                </Text>
              </a>
            </Link>
            <Link href="/aboutus/roadmap">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Roadmap
                </Text>
              </a>
            </Link>
          </Flex>

          {/* Column 2: Privacy Policy */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/privacypolicy">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  Privacy Policy
                </Text>
              </a>
            </Link>
            <Link href="/privacypolicy/legal">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Terms of Service
                </Text>
              </a>
            </Link>
            <Link href="/privacypolicy/tos">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Legal Notice
                </Text>
              </a>
            </Link>
          </Flex>

          {/* Column 3: Community */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/community">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  Community
                </Text>
              </a>
            </Link>
            <Link href="/community/social">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Social Media
                </Text>
              </a>
            </Link>
            <Link href="/community/referral">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Referral Program
                </Text>
              </a>
            </Link>
            <Link href="/community/affiliate">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Affiliate Program
                </Text>
              </a>
            </Link>
            <Link href="/community/events">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Events
                </Text>
              </a>
            </Link>
            <Link href="/community/downloads">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Downloads
                </Text>
              </a>
            </Link>
            <Link href="/community/blog">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  News Blog
                </Text>
              </a>
            </Link>
          </Flex>

          {/* Column 4: Help Center */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/help">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  Help Center
                </Text>
              </a>
            </Link>
            <Link href="/help/tutorials">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Tutorials
                </Text>
              </a>
            </Link>
            <Link href="/help/guides">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Guides
                </Text>
              </a>
            </Link>
            <Link href="/help/glossary">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Glossary
                </Text>
              </a>
            </Link>
            <Link href="/help/faq">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  FAQ
                </Text>
              </a>
            </Link>
            <Link href="/help/troubleshooting">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Troubleshooting
                </Text>
              </a>
            </Link>
            <Link href="/help/support">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Support
                </Text>
              </a>
            </Link>
          </Flex>

          {/* Column 5: Contact */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/contact">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  Contact
                </Text>
              </a>
            </Link>
            <Link href="/contact/mediakit">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Media Kit
                </Text>
              </a>
            </Link>
            <Link href="/contact/careers">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Careers
                </Text>
              </a>
            </Link>
            <Link href="/contact/newsletter">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Newsletter
                </Text>
              </a>
            </Link>
            <Link href="/contact/sitemap">
              <a rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Sitemap
                </Text>
              </a>
            </Link>
          </Flex>

          {/* Column 6: Social */}
          <Flex direction={"column"} px="10px" borderRight={"solid 1px gray"}>
            <Link href="/community/social">
              <a rel="noopener noreferrer">
                <Text color="white" fontSize="18px" fontWeight={"700"} cursor="pointer" _hover={linkHover}>
                  Social
                </Text>
              </a>
            </Link>
            <Link href="https://facebook.com/cryptodromo">
              <a target="_blank" rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Facebook
                </Text>
              </a>
            </Link>
            <Link href="https://instagram.com/cryptodromo">
              <a target="_blank" rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Instagram
                </Text>
              </a>
            </Link>
            <Link href="https://x.com/cryptodromo">
              <a target="_blank" rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  X
                </Text>
              </a>
            </Link>
            <Link href="https://tiktok.com/@cryptodromo">
              <a target="_blank" rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Tiktok
                </Text>
              </a>
            </Link>
            <Link href="https://youtube.com/@cryptodromo">
              <a target="_blank" rel="noopener noreferrer">
                <Text color="gray.100" fontSize="15px" cursor="pointer" _hover={linkHover}>
                  Youtube
                </Text>
              </a>
            </Link>
          </Flex>
        </Flex>

        {/* Right side: Matching Logo */}
        <Flex
          flexDirection={"column"}
          textAlign={"right"}
          justifyContent="space-between"
          h="100%"
        >
          <Flex>
            <Link href="/">
              <a rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
                <Image
                  width={200}
                  src={"/texturas/logo_janch_header.png"}
                  alt="Cryptodromo"
                />
              </a>
            </Link>
          </Flex>
          <Flex textAlign={"right"} justifyContent={"end"}>
            <Text color="gray.100" fontSize="15px"></Text>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
