/**
 * About Page - Single page with tabs for Documentation, Demo, and Tests
 * Uses Fluent UI v9 components throughout
 */
import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  TabList,
  Tab,
  TabValue,
  SelectTabData,
  SelectTabEvent,
  Button,
  Link,
  Badge,
  Text,
  Divider,
} from '@fluentui/react-components';
import {
  Book24Regular,
  Color24Regular,
  BeakerSettingsRegular,
  BranchFork24Regular,
  Open24Regular,
  Wrench24Regular,
} from '@fluentui/react-icons';
import HowTo from '../howto/HowTo';
import Demo from '../demo/Demo';
import Tests from '../tests/Tests';
import { ModalBuilder } from '../demo/builder';
import '../demo/builder/styles.css';

declare const PACKAGE_VERSION: string;

type TabType = 'documentation' | 'demo' | 'builder' | 'tests';

const useStyles = makeStyles({
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow4,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  logoIcon: {
    width: '32px',
    height: '32px',
  },
  logoText: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  version: {
    marginLeft: tokens.spacingHorizontalS,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  tabsContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
  },
  tabIcon: {
    marginRight: tokens.spacingHorizontalXS,
  },
  main: {
    flex: 1,
    overflow: 'auto',
  },
  tabContent: {
    height: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  footerLinks: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
});

export const About: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<TabType>('documentation');

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as TabType);
  };

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img 
            src="/WebResources/err403_/logo.svg" 
            alt="err403 Logo" 
            className={styles.logoIcon}
          />
          <Text className={styles.logoText}>err403 UI Library</Text>
          {PACKAGE_VERSION && (
            <Badge appearance="outline" className={styles.version}>
              v{PACKAGE_VERSION}
            </Badge>
          )}
        </div>

        <div className={styles.headerActions}>
          <Button
            as="a"
            href="https://github.com/garethcheyne/DYN365CE-Modal-and-More"
            target="_blank"
            rel="noopener noreferrer"
            appearance="subtle"
            icon={<BranchFork24Regular />}
          >
            GitHub
          </Button>
          <Button
            as="a"
            href="https://err403.com"
            target="_blank"
            rel="noopener noreferrer"
            appearance="primary"
            icon={<Open24Regular />}
          >
            err403.com
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={handleTabSelect}
          size="large"
        >
          <Tab value="documentation" icon={<Book24Regular className={styles.tabIcon} />}>
            Documentation
          </Tab>
          <Tab value="demo" icon={<Color24Regular className={styles.tabIcon} />}>
            Demo
          </Tab>
          <Tab value="builder" icon={<Wrench24Regular className={styles.tabIcon} />}>
            Builder
          </Tab>
          <Tab value="tests" icon={<BeakerSettingsRegular className={styles.tabIcon} />}>
            Tests
          </Tab>
        </TabList>
      </div>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.tabContent}>
          {activeTab === 'documentation' && <HowTo />}
          {activeTab === 'demo' && <Demo />}
          {activeTab === 'builder' && <ModalBuilder />}
          {activeTab === 'tests' && <Tests />}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <Text size={200}>
          &copy; {new Date().getFullYear()} err403.com - Dynamics 365 CE UI Library
        </Text>
        <div className={styles.footerLinks}>
          <Text size={200}>Built with TypeScript + React + Fluent UI</Text>
        </div>
      </footer>
    </div>
  );
};

export default About;
