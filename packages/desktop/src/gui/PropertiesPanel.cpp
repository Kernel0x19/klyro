#include "gui/PropertiesPanel.hpp"

#include <QFrame>
#include <QHBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QStackedWidget>
#include <QToolButton>
#include <QVBoxLayout>

PropertiesPanel::PropertiesPanel(QWidget* parent) : QWidget(parent)
{
    setObjectName("PanelSurface");
    setMinimumWidth(40);
    setMaximumWidth(216);

    auto* root = new QVBoxLayout(this);
    root->setContentsMargins(0, 0, 0, 0);
    root->setSpacing(0);

    m_stack = new QStackedWidget(this);
    m_expanded = new QWidget(this);
    auto* expandedLayout = new QVBoxLayout(m_expanded);
    expandedLayout->setContentsMargins(0, 0, 0, 0);
    expandedLayout->setSpacing(0);

    auto* header = new QWidget(m_expanded);
    header->setObjectName("PanelHeader");
    auto* headerLayout = new QHBoxLayout(header);
    headerLayout->setContentsMargins(10, 6, 7, 6);
    auto* heading = new QLabel("PROPERTIES", header);
    heading->setProperty("muted", true);
    heading->setStyleSheet("font-size: 12px; font-weight: 800; letter-spacing: 1px;");
    headerLayout->addWidget(heading);
    headerLayout->addStretch();
    auto* collapse = new QToolButton(header);
    collapse->setText("›");
    collapse->setToolTip("Collapse properties panel");
    collapse->setObjectName("IconButton");
    connect(collapse, &QToolButton::clicked, this, [this]() { setCollapsed(true); });
    headerLayout->addWidget(collapse);
    expandedLayout->addWidget(header);

    auto* content = new QWidget(m_expanded);
    auto* contentLayout = new QVBoxLayout(content);
    contentLayout->setContentsMargins(12, 12, 12, 12);
    contentLayout->setSpacing(8);
    auto* icon = new QLabel("▣", content);
    icon->setAlignment(Qt::AlignCenter);
    icon->setFixedSize(40, 40);
    icon->setStyleSheet("background: palette(mid); border-radius: 8px; font-size: 18px;");
    contentLayout->addWidget(icon, 0, Qt::AlignHCenter);
    m_title = new QLabel("No component selected", content);
    m_title->setAlignment(Qt::AlignCenter);
    m_title->setStyleSheet("font-weight: 700; font-size: 12px;");
    contentLayout->addWidget(m_title);
    m_description = new QLabel("Click an IC slot on the board to inspect its properties", content);
    m_description->setAlignment(Qt::AlignCenter);
    m_description->setWordWrap(true);
    m_description->setProperty("muted", true);
    m_description->setStyleSheet("font-size: 11px;");
    contentLayout->addWidget(m_description);
    contentLayout->addStretch();
    expandedLayout->addWidget(content, 1);

    m_collapsedRail = new QWidget(this);
    auto* railLayout = new QVBoxLayout(m_collapsedRail);
    railLayout->setContentsMargins(3, 7, 3, 7);
    railLayout->setSpacing(7);
    auto* expand = new QToolButton(m_collapsedRail);
    expand->setText("‹");
    expand->setToolTip("Expand properties panel");
    expand->setFixedSize(32, 32);
    connect(expand, &QToolButton::clicked, this, [this]() { setCollapsed(false); });
    railLayout->addWidget(expand, 0, Qt::AlignHCenter);
    auto* line = new QWidget(m_collapsedRail);
    line->setFixedHeight(1);
    line->setStyleSheet("background: palette(mid);");
    railLayout->addWidget(line);
    auto* cpu = new QLabel("▣", m_collapsedRail);
    cpu->setAlignment(Qt::AlignCenter);
    cpu->setToolTip("Properties");
    railLayout->addWidget(cpu);
    railLayout->addStretch();

    m_stack->addWidget(m_expanded);
    m_stack->addWidget(m_collapsedRail);
    root->addWidget(m_stack);
    setCollapsed(false);
}

void PropertiesPanel::setCollapsed(bool collapsed)
{
    m_collapsed = collapsed;
    m_stack->setCurrentWidget(collapsed ? m_collapsedRail : m_expanded);
    setFixedWidth(collapsed ? 40 : 216);
    emit collapseChanged(collapsed);
}

void PropertiesPanel::setDarkTheme(bool dark)
{
    m_dark = dark;
    Q_UNUSED(m_dark);
}

void PropertiesPanel::showSlot(int slotIndex, const QString& partNumber)
{
    if (partNumber.isEmpty()) {
        m_title->setText(QString("IC BASE %1").arg(slotIndex + 1));
        m_description->setText("Empty fixed IC socket. Choose an IC from the library to assign it to this slot.");
    } else {
        m_title->setText(partNumber);
        m_description->setText(QString("Assigned to IC slot %1. Pinout and electrical details will appear here.").arg(slotIndex + 1));
    }
}
