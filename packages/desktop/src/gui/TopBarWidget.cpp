#include "gui/TopBarWidget.hpp"

#include <QAction>
#include <QFrame>
#include <QHBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QMenu>
#include <QPixmap>
#include <QStyle>
#include <QToolButton>
#include <QVBoxLayout>

namespace {
QToolButton* makeButton(const QString& text, const QString& tooltip,
                        const QString& objectName, QWidget* parent)
{
    auto* button = new QToolButton(parent);
    button->setText(text);
    button->setToolTip(tooltip);
    button->setObjectName(objectName);
    button->setCursor(Qt::PointingHandCursor);
    button->setAutoRaise(true);
    button->setToolButtonStyle(Qt::ToolButtonTextOnly);
    button->setMinimumSize(32, 32);
    return button;
}
}

TopBarWidget::TopBarWidget(QWidget* parent) : QWidget(parent)
{
    setObjectName("TopBar");
    setFixedHeight(84);

    auto* row = new QHBoxLayout(this);
    row->setContentsMargins(18, 7, 24, 7);
    row->setSpacing(12);

    auto* brand = new QWidget(this);
    auto* brandLayout = new QHBoxLayout(brand);
    brandLayout->setContentsMargins(0, 0, 12, 0);
    brandLayout->setSpacing(8);

    auto* logo = new QLabel(brand);
    logo->setFixedSize(38, 38);
    QPixmap pixmap("../../resources/images/klyro-logo-new.png");
    if (!pixmap.isNull()) {
        logo->setPixmap(pixmap.scaled(38, 38, Qt::KeepAspectRatio, Qt::SmoothTransformation));
    }
    brandLayout->addWidget(logo);

    auto* name = new QLabel("Klyro", brand);
    QFont brandFont("Space Grotesk");
    brandFont.setPointSize(24);
    brandFont.setWeight(QFont::Bold);
    name->setFont(brandFont);
    brandLayout->addWidget(name);

    auto* version = new QLabel("v0.1.0", brand);
    version->setStyleSheet("font-size: 10px; font-weight: 700;");
    brandLayout->addWidget(version, 0, Qt::AlignBottom);
    row->addWidget(brand);

    auto* separator = new QFrame(this);
    separator->setFrameShape(QFrame::VLine);
    separator->setObjectName("TopSeparator");
    separator->setFixedHeight(48);
    row->addWidget(separator);

    m_projectName = new QLineEdit("Untitled Project", this);
    m_projectName->setObjectName("ProjectName");
    m_projectName->setFrame(false);
    m_projectName->setMinimumWidth(170);
    m_projectName->setMaximumWidth(250);
    m_projectName->setStyleSheet("QLineEdit#ProjectName { background: transparent; border: none; font-size: 16px; font-weight: 600; padding: 4px; }");
    m_projectName->setToolTip("Project name");
    row->addWidget(m_projectName);

    row->addStretch(1);

    auto* modules = new QWidget(this);
    auto* moduleLayout = new QHBoxLayout(modules);
    moduleLayout->setContentsMargins(0, 0, 0, 0);
    moduleLayout->setSpacing(8);

    const QStringList moduleNames = {
        "Board", "K-Map Visualiser", "FSM", "PLD", "HDL", "Learn"
    };
    for (const QString& module : moduleNames) {
        auto* button = makeButton(module, module, "ModuleButton", modules);
        button->setCheckable(true);
        button->setChecked(module == "Board");
        button->setMinimumWidth(module == "K-Map Visualiser" ? 138 : 44);
        connect(button, &QToolButton::clicked, this, [this, module]() {
            setActiveModule(module);
            emit moduleSelected(module);
        });
        m_moduleButtons.append(button);
        moduleLayout->addWidget(button);
    }
    row->addWidget(modules);
    row->addStretch(1);

    auto* actions = new QWidget(this);
    auto* actionLayout = new QHBoxLayout(actions);
    actionLayout->setContentsMargins(0, 0, 0, 0);
    actionLayout->setSpacing(5);

    auto* run = makeButton("▶", "Run simulation", "IconButton", actions);
    connect(run, &QToolButton::clicked, this, &TopBarWidget::runRequested);
    actionLayout->addWidget(run);

    auto* open = makeButton("▣", "Open project", "IconButton", actions);
    connect(open, &QToolButton::clicked, this, &TopBarWidget::openRequested);
    actionLayout->addWidget(open);

    auto* save = makeButton("▤", "Save project", "IconButton", actions);
    connect(save, &QToolButton::clicked, this, &TopBarWidget::saveRequested);
    actionLayout->addWidget(save);

    auto* actionSeparator = new QFrame(actions);
    actionSeparator->setFrameShape(QFrame::VLine);
    actionSeparator->setFixedHeight(38);
    actionLayout->addWidget(actionSeparator);

    auto* settings = makeButton("⚙", "Settings", "IconButton", actions);
    auto* settingsMenu = new QMenu(settings);
    QAction* themeAction = settingsMenu->addAction("Toggle light / dark theme");
    connect(themeAction, &QAction::triggered, this, &TopBarWidget::themeToggleRequested);
    settingsMenu->addSeparator();
    settingsMenu->addAction("Grid settings")->setEnabled(false);
    settingsMenu->addAction("Keyboard shortcuts")->setEnabled(false);
    settings->setMenu(settingsMenu);
    settings->setPopupMode(QToolButton::InstantPopup);
    actionLayout->addWidget(settings);

    auto* avatar = makeButton("M", "Profile", "AvatarButton", actions);
    avatar->setFixedSize(30, 30);
    actionLayout->addWidget(avatar);

    row->addWidget(actions);
}

void TopBarWidget::setActiveModule(const QString& moduleName)
{
    m_activeModule = moduleName;
    for (QToolButton* button : m_moduleButtons) {
        const bool active = button->text() == moduleName;
        button->setChecked(active);
        button->setObjectName(active ? "ActiveModule" : "ModuleButton");
        button->style()->unpolish(button);
        button->style()->polish(button);
    }
}
